import { isatty } from "tty";
import prettybytes from "pretty-bytes";
import chalk from "chalk";
import { io } from "socket.io-client";
import Table from "cli-table";
import net from "net";
import ss from "@sap_oss/node-socketio-stream";

export const listen = async ({
  PROVIDER,
  TO_PROTOCOL,
  TO_PORT,
  TO_HOST,
  SECURE,
  PREFERRED_PORT,
}) => {
  const [PROVIDER_HOST] = PROVIDER.split(":");

  let netSockets = {};

  const tty = isatty(process.stdout.fd);

  const IO_PROTOCOL = SECURE ? "https" : "http";
  const socket = io(`${IO_PROTOCOL}://${PROVIDER}`);

  let error = "";
  let reconnecting = false;
  const logs = [];
  let NET_PORT = "";

  socket.on("connect_error", (err) => {
    reconnecting = true;
    error = err.message;
    updateConsole();
  });

  socket.on("connect", function () {
    reconnecting = false;

    socket.emit(
      "register_tcp_listener",
      { preferredPort: PREFERRED_PORT },
      ({ port, err }) => {
        if (err) {
          console.error(err);
          process.exit();
        }

        NET_PORT = port;
        updateConsole();
      }
    );
    updateConsole();
  });

  socket.io.on("reconnection_attempt", () => {
    reconnecting = true;
    updateConsole();
  });

  socket.on("disconnect", function () {
    reconnecting = true;
    netSockets = {};
    updateConsole();
  });

  setInterval(() => {
    updateConsole();
    if (socket.disconnected) {
      reconnecting = true;
      socket.connect();
    }
  }, 5000);

  const writeStatus = () => {
    const table = new Table();
    if (socket.connected) {
      table.push({
        [chalk.white("Status")]: chalk.green("Live"),
      });

      if (NET_PORT) {
        table.push({
          [chalk.white(
            "Forwarding"
          )]: `tcp://${PROVIDER_HOST}:${NET_PORT} -> tcp://${TO_HOST}:${TO_PORT}`,
        });

        const connectedNetSockets = Object.values(netSockets).filter(
          (netSocket) => !netSocket.connecting && !netSocket.destroyed
        ).length;

        const bytesRead = Object.values(netSockets).reduce(
          (acc, curr) => acc + curr.bytesRead,
          0
        );

        const bytesWritten = Object.values(netSockets).reduce(
          (acc, curr) => acc + curr.bytesWritten,
          0
        );

        table.push(
          {
            [chalk.white("Connections")]: connectedNetSockets,
          },
          {
            [chalk.white("Read")]: prettybytes(bytesRead),
          },
          {
            [chalk.white("Written")]: prettybytes(bytesWritten),
          }
        );
      }
    } else {
      if (reconnecting) {
        table.push({
          [chalk.white("Status")]: chalk.yellow("Reconnecting"),
        });
      } else {
        table.push({
          [chalk.white("Status")]: chalk.red("Disconnected"),
        });
        if (error) {
          table.push({
            [chalk.white("Error")]: chalk.red(String(error)),
          });
        }
      }
    }
    console.log(table.toString());
  };

  const updateConsole = () => {
    if (!tty) return;
    console.clear();
    writeStatus();
    console.log();
    for (const log of logs) {
      console.log(log);
    }
  };

  ss(socket).on(
    "tcp_connection",
    ({ connectionId, remoteAddress }, socketStream) => {
      const client = new net.Socket();

      netSockets[connectionId] = client;


      client.connect(TO_PORT, TO_HOST, () => {
        socket.emit(`${connectionId}_connected`);
        updateConsole();

      });

      socketStream.pipe(client);
      client.pipe(socketStream);
    }
  );
};
