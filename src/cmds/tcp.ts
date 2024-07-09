import { parseTo } from "./utils/parse.js";

export const command = "tcp [to]";
export const desc = "Start tunnelr tcp client";
export const builder = {
  preferredPort: {
    default: process.env.TUNNELR_PREFERRED_PORT || undefined,
  },
  to: {
    default: process.env.TUNNELR_TO || "localhost:80",
  },
  provider: {
    default: process.env.TUNNELR_PROVIDER || "0.tunnelr.co",
  },
  secure: {
    describe: "use secure connection to tunnelr server",
    type: "boolean",
    default: true,
  },
};

export const handler = async (argv) => {
  const { listen } = await import("../client/client-tcp.js");
  listen({
    PROVIDER: argv.provider,
    SECURE: argv.secure,
    PREFERRED_PORT: argv.preferredPort,
    ...parseTo(argv.to),
  });
};
