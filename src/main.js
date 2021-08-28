#!/usr/bin/env node
import args from "args";
import crypto from "crypto";

args
  .option("mode", "Operation mode, [client, server] Default: client")
  .option("protocol", "Client only option. Protocol, [tcp, http] Default: http")
  .option("from", "Client only option. The URL of the remote server.")
  .option("to", "Client only option. Shorthand for HOST:PORT.")
  .option(
    "port",
    "For server this is the remote port it will listen to requests on. Default: 80"
  );

const generateUrl = () => {
  const id = crypto.randomBytes(10).toString("hex");
  return `${id}-dot-test-test451.ew.r.appspot.com:80`;
};
const flags = args.parse(process.argv);
const MODE = flags.mode || process.env.MODE || "client";

// Server option
const SERVER_PORT = flags.port || process.env.PORT || 80;

// Client option

const getClientOptions = () => {
  const PROTOCOL = flags.protocol || process.env.PROTOCOL || "http";
  let FROM = flags.from || process.env.FROM || generateUrl();
  let TO = flags.to || process.env.TO;
  let [HOST_TO, PORT_TO] = TO.split(":");
  if (!HOST_TO) {
    HOST_TO = "localhost";
  }
  if (!PORT_TO) {
    PORT_TO = 80;
  }
  TO = `${HOST_TO}:${PORT_TO}`;

  return { FROM, TO, PROTOCOL };
};

if (!MODE) {
  args.showHelp();
  process.exit();
}

(async () => {
  switch (MODE) {
    case "client": {
      const { FROM, TO, PROTOCOL } = getClientOptions();
      let client;

      switch (PROTOCOL) {
        case "http":
          client = await import("./client-http.js");
          break;
        case "tcp":
          client = await import("./client-tcp.js");
          break;
        default:
          break;
      }

      client.listen({
        FROM,
        TO,
      });
      break;
    }
    case "server": {
      const { listen } = await import("./server.js");
      listen({
        PORT: SERVER_PORT,
      });
      break;
    }

    default:
      args.showHelp();
      break;
  }
})();
