import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.89"],
};

export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withSerwistInit({
      swSrc: "app/sw.ts",
      swDest: "public/sw.js",
    })(nextConfig);
