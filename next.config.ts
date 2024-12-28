import withPWA from 'next-pwa';

const nextConfig = {
};

export default withPWA({
  ...nextConfig,
  dest: 'public', // Required: Where to store service worker files
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
});
