import { isatty } from "tty";
import got from "got";
import chalk from "chalk";
import { io } from "socket.io-client";

export const listen = async ({ FROM, TO, SECURE }) => {
  const tty = isatty(process.stdout.fd);

  const [TO_HOST, TO_PORT] = TO.split(":");
  const [FROM_HOST, FROM_PORT] = FROM.split(":");

  const IO_PROTOCOL = SECURE ? "https" : "http";
  const socket = io(`${IO_PROTOCOL}://${FROM_HOST}`);

  let error = "";
  let reconnecting = false;
  const logs = [];

  socket.on("connect_error", (err) => {
    reconnecting = false;
    error = err.message;
    updateConsole();
  });

  socket.on("connect", function () {
    reconnecting = false;
    socket.emit("register_http_listener", {});
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
    if (socket.connected) {
      console.log(chalk.green("Connected"));
      console.log(`Forwarding   https://${FROM_HOST} -> ${TO}`);
      console.log(`Forwarding   http://${FROM_HOST} -> ${TO}`);
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

  socket.on("get", async ({ url, headers, responseKey }) => {
    try {
      const response = await got.get(`http://${TO}${url}`, {
        headers,
        followRedirect: false,
      });
      const _res = {
        status: response.statusCode,
        body: response.body,
        headers: response.headers,
      };

      socket.emit(responseKey, _res);
      addLog(`GET ${url} ${chalk.green(response.statusCode)}`);
    } catch (error) {
      socket.emit(responseKey, {
        status: error.response?.statusCode || 404,
        headers: error.response?.headers,
        body: error.response?.body,
      });
      addLog(`GET ${url} ${chalk.red(error.response?.statusCode || "404")}`);
    }
  });

  socket.on("post", async ({ url, headers, body, responseKey }) => {
    try {
      const response = await got.post(`http://${TO}${url}`, {
        body,
        headers,
      });
      const _res = {
        status: response.statusCode,
        body: response.body,
        headers: response.headers,
      };
      socket.emit(responseKey, _res);
      addLog(`POST ${url} ${chalk.green(response.statusCode)}`);
    } catch (error) {
      socket.emit(responseKey, {
        status: error.response?.statusCode || 404,
        headers: error.response?.headers,
        body: error.response?.body,
      });
      addLog(`POST ${url} ${chalk.red(error.response?.statusCode || "404")}`);
    }
  });
};
