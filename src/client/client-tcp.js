import { isatty } from "tty";
import prettybytes from "pretty-bytes";
import chalk from "chalk";
import { io } from "socket.io-client";
import Table from "cli-table";
import net from "net";

export const listen = async ({ PROVIDER, TO, SECURE, PREFERRED_PORT }) => {
  const [TO_HOST, TO_PORT] = TO.split(":");
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
    reconnecting = false;
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
    reconnecting = false;
    netSockets = {};
    updateConsole();
  });

  setInterval(() => {
    if (socket.disconnected) {
      reconnecting = true;
      socket.connect();
    }
  }, 5000);

  const addLog = (log) => {
    if (tty) {
      if (logs.length > 5) {
        logs.pop();
      }
      logs.unshift(log);
      updateConsole();
    } else {
      console.log(log);
    }
  };

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
          )]: `tcp://${PROVIDER_HOST}:${NET_PORT} -> tcp://${TO}`,
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
    if (tty) {
      console.clear();
      writeStatus();
      console.log();
      for (const log of logs) {
        console.log(log);
      }
    } else {
      writeStatus();
    }
  };

  socket.on("tcp_connection", ({ connectionId, remoteAddress }) => {
    const client = new net.Socket();

    netSockets[connectionId] = client;

    client.connect(TO_PORT, TO_HOST, () => {
      socket.emit(`${connectionId}_connected`);
      updateConsole();
    });

    client.on("data", (data) => {
      socket.emit(`${connectionId}_data`, data);
      updateConsole();
    });

    client.on("close", () => {
      socket.emit(`${connectionId}_close`);
      updateConsole();
    });

    client.on("error", (err) => {
      socket.emit(`${connectionId}_error`, err);
      updateConsole();
    });

    socket.on(`${connectionId}_data`, (data) => {
      client.write(data);
      updateConsole();
    });

    socket.on(`${connectionId}_close`, () => {
      client.destroy();
      updateConsole();
    });

    socket.on(`${connectionId}_error`, (err) => {
      client.destroy(err);
      updateConsole();
    });
  });
};
