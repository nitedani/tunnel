import crypto from "crypto";
import { parseTo } from "./utils/parse.js";

export const command = "http [to]";
export const desc = "Start tunnelr http client";
export const builder = {
  room: {
    default: process.env.TUNNELR_ROOM || crypto.randomBytes(5).toString("hex"),
  },
  to: {
    default: process.env.TUNNELR_TO || "localhost:80",
  },
  provider: {
    default: process.env.TUNNELR_PROVIDER || "0.tunnelr.co",
  },
  "dot-domain": {
    describe: "-dot- subdomain compatibility",
    type: "boolean",
    default: false,
  },
  secure: {
    describe: "use secure connection to tunnelr server",
    type: "boolean",
    default: true,
  },
};

export const handler = async (argv) => {
  const { listen } = await import("../client/client-http.js");
  listen({
    PROVIDER: `${argv.room}${argv["dot-domain"] ? "-dot-" : "."}${
      argv.provider
    }`,
    SECURE: argv.secure,
    ...parseTo(argv.to),
  });
};
