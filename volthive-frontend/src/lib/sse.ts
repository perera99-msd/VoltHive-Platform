// volthive-frontend/src/lib/sse.ts
// Minimal fetch-based Server-Sent Events client.
//
// Native EventSource cannot set an Authorization header, and putting the
// Firebase token in the URL would leak it into logs. This client uses
// fetch + ReadableStream so the token travels in the Bearer header, and it
// provides auto-reconnect with exponential backoff.
//
// Usage:
//   const client = createSSEClient(url, { token, onEvent, onStatus });
//   client.close();

export type SSEStatus = 'connecting' | 'open' | 'closed';

interface SSEClientOptions {
  token: () => Promise<string | null>;
  onEvent: (event: string, data: unknown) => void;
  onStatus?: (status: SSEStatus) => void;
  /** Initial reconnect delay in ms. Default 1000. */
  initialDelayMs?: number;
  /** Max reconnect delay in ms. Default 30000. */
  maxDelayMs?: number;
}

interface SSEClientHandle {
  close: () => void;
}

export function createSSEClient(
  url: string,
  options: SSEClientOptions
): SSEClientHandle {
  const {
    token,
    onEvent,
    onStatus,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
  } = options;

  let closed = false;
  let abortController: AbortController | null = null;
  let retryDelay = initialDelayMs;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (status: SSEStatus) => {
    // Allow the final 'closed' notification even after close() to reset UI.
    if (onStatus) onStatus(status);
  };

  const parseStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    signal: AbortSignal
  ) => {
    const decoder = new TextDecoder();
    let buffer = '';

    const handleChunk = (chunk: string) => {
      buffer += chunk;
      // SSE frames are separated by a blank line.
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        let eventName = 'message';
        const dataLines: string[] = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith(':')) continue; // comment / heartbeat (": ping")
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (dataLines.length === 0) continue;

        const dataStr = dataLines.join('\n');
        let data: unknown = dataStr;
        try {
          data = JSON.parse(dataStr);
        } catch {
          // keep raw string if not JSON
        }
        onEvent(eventName, data);
      }
    };

    try {
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        handleChunk(decoder.decode(value, { stream: true }));
      }
    } catch {
      // Stream error / aborted — loop exits.
      if (signal.aborted) return;
    } finally {
      decoder.decode(); // flush
      if (!signal.aborted) {
        handleChunk('\n\n'); // flush any trailing frame
      }
    }
  };

  const connect = async () => {
    if (closed) return;

    const accessToken = await token();
    if (closed || !accessToken) {
      // No token (logged out) — stop.
      setStatus('closed');
      return;
    }

    setStatus('connecting');
    abortController = new AbortController();

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: abortController.signal,
        // SSE must not be cached or buffered.
        cache: 'no-store',
      });

      if (closed) return;
      if (!res.ok || !res.body) {
        throw new Error(`SSE handshake failed: ${res.status}`);
      }

      // Connected — reset backoff.
      retryDelay = initialDelayMs;
      setStatus('open');

      await parseStream(res.body.getReader(), abortController.signal);

      // Stream ended (server closed or transient) — reconnect unless closed.
      if (!closed && !abortController.signal.aborted) scheduleReconnect();
    } catch (err) {
      if (closed || abortController?.signal.aborted) return;
      console.warn('SSE connection error, reconnecting...', (err as Error)?.message);
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!closed) connect();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, maxDelayMs);
  };

  connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      abortController?.abort();
      setStatus('closed');
    },
  };
}
