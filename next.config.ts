import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: false,
  reloadOnOnline: true,
});

const nextConfig = {
  turbopack: {},
};

export default withSerwist(nextConfig);