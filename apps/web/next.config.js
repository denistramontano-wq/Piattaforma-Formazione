/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output minimale e autosufficiente, pensato per l'immagine Docker di produzione (vedi Dockerfile).
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'example-cdn.piattaforma-formazione.it' },
    ],
  },
};

module.exports = nextConfig;
