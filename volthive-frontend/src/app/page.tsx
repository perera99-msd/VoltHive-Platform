export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">VoltHive</h1>
        <p className="max-w-xl text-slate-600">
          Universal EV charging aggregator for station owners and drivers.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href="/login"
            className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800"
          >
            Go to Login
          </a>
          <a
            href="/driver-dashboard"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Driver Dashboard
          </a>
          <a
            href="/owner-dashboard"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Owner Dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
