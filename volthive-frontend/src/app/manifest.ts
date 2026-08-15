import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'VoltHive',
    short_name: 'VoltHive',
    description: 'EV charging made simple — find stations, chat with them, and book smart.',
    start_url: '/driver-login',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    background_color: '#f8fafc',
    theme_color: '#092034',
    categories: ['utilities', 'travel'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
