import { isatty } from "tty";
import chalk from "chalk";
import { io } from "socket.io-client";
import net from "net";

export const listen = async ({ FROM, TO, SECURE }) => {
    const [TO_HOST, TO_PORT] = TO.split(":");
    const [FROM_HOST, FROM_PORT] = FROM.split(":");

  const tty = isatty(process.stdout.fd);

  const IO_PROTOCOL = SECURE ? "https" : "http";
  const socket = io(`${IO_PROTOCOL}://${FROM_HOST}`);

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
    socket.emit("register_tcp_listener", {});
    updateConsole();
  });

  socket.io.on("reconnection_attempt", () => {
    reconnecting = true;
    updateConsole();
  });

  socket.on("disconnect", function () {
    reconnecting = false;
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
    if (NET_PORT) {
      console.log(chalk.green("Connected"));
      console.log(`Forwarding    ${FROM_HOST}:${NET_PORT} -> ${TO}`);
    } else {
      if (reconnecting) {
        console.log(chalk.yellow("Reconnecting.."));
      } else {
        console.log(chalk.red(`Disconnected - ${error}`));
      }
    }
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

  socket.on("tcp_listening", (port) => {
    NET_PORT = port;
    updateConsole();
  });

  socket.on("tcp_connection", ({ connectionId }) => {
    addLog("TCP CONNECTION");
    const client = new net.Socket();

    client.connect(TO_PORT, TO_HOST, () => {
      socket.emit(`${connectionId}_connected`);
    });

    client.on("data", (data) => {
      socket.emit(`${connectionId}_data`, data);
    });

    client.on("close", () => {
      socket.emit(`${connectionId}_close`);
    });

    client.on("error", (err) => {
      socket.emit(`${connectionId}_error`, err);
    });

    socket.on(`${connectionId}_data`, (data) => {
      client.write(data);
    });

    socket.on(`${connectionId}_close`, () => {
      client.destroy();
    });

    socket.on(`${connectionId}_error`, (err) => {
      client.destroy(err);
    });
  });
};
