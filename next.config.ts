import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";
import type { NextConfig } from "next";

// `npm run dev:lan` serves the dev site to phones on the same network. The dev server only trusts
// localhost and its start hostname, so allow this machine's current LAN IPv4 addresses too.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((info): info is NetworkInterfaceInfo => info?.family === "IPv4" && !info.internal)
  .map((info) => info.address);

const nextConfig: NextConfig = {
  // CLAUDE.md is the agent guide for this repo; stop `next dev` from writing AGENTS.md.
  agentRules: false,
  allowedDevOrigins: lanHosts,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
