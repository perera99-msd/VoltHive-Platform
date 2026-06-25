import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VoltHive EV Charging Network',
    short_name: 'VoltHive',
    description: 'Standalone PWA EV driver platform for instant charging discovery, biometrics authentication, and dynamic AI surge reservations.',
    start_url: '/driver-login',
    display: 'standalone',
    background_color: '#092034',
    theme_color: '#4a90a4',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
