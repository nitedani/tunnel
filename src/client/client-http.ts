import { isatty } from "tty";
import got from "got";
import chalk from "chalk";
import { io } from "socket.io-client";
import ss from "@sap_oss/node-socketio-stream";
import stream from "stream";
import { promisify } from "util";
import request from "request";

export interface HttpClientArgs {
  PROVIDER: string;
  ROOM: string;
  TO_PROTOCOL: string;
  TO_HOST: string;
  TO_PORT: number;
  SECURE: boolean;
  TTY?: boolean;
}

const pipeline = promisify(stream.pipeline);
export const listen = async ({
  PROVIDER,
  ROOM,
  TO_PROTOCOL,
  TO_HOST,
  TO_PORT,
  SECURE,
  TTY,
}: HttpClientArgs) => {
  const tty = TTY === undefined ? isatty(process.stdout.fd) : TTY;

  const IO_PROTOCOL = SECURE ? "https" : "http";
  const socket = io(`${IO_PROTOCOL}://${PROVIDER}`, {
    query: {
      room: ROOM,
    },
  });

  let error = "";
  let reconnecting = false;
  const logs: string[] = [];

  socket.on("connect_error", (err) => {
    reconnecting = true;
    error = err.message;
    updateConsole();
  });

  socket.on("connect", function () {
    reconnecting = false;
    socket.emit("register_http_listener", {});
    updateConsole();
  });

  socket.on("disconnect", function () {
    reconnecting = true;
    updateConsole();
  });

  setInterval(() => {
    if (socket.disconnected) {
      reconnecting = true;
      socket.connect();
    }
  }, 5000);

  const addLog = (log: string) => {
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
      console.log(chalk.green("Live"));
      console.log(
        `Forwarding   https://${PROVIDER} -> ${TO_PROTOCOL}://${TO_HOST}:${TO_PORT}`
      );
      console.log(
        `Forwarding   http://${PROVIDER} -> ${TO_PROTOCOL}://${TO_HOST}:${TO_PORT}`
      );
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

  ss(socket).on("get", ({ url, headers }, socketStream) => {
    request(`${TO_PROTOCOL}://${TO_HOST}:${TO_PORT}${url}`, {
      headers: { ...headers, host: TO_HOST },
      followRedirect: false,
    })
      .on("socket", (sock) => {
        sock.pipe(socketStream);
        socketStream.pipe(sock);
      })
      .on("complete", (response) => {
        const statusCode = response.statusCode;
        const isOk = statusCode < 400 || statusCode > 500;
        if (isOk) {
          addLog(
            `GET ${url.substring(0, 80)} ${chalk.green(response.statusCode)}`
          );
        } else {
          addLog(
            `GET ${url.substring(0, 80)} ${chalk.red(response.statusCode)}`
          );
        }
      })
      .on("error", (err) => {
        addLog(`GET ${url.substring(0, 80)} ${chalk.red(err)}`);
      });
  });

  socket.on("post", async ({ url, headers, body, responseKey }) => {
    try {
      const response = await got.post(
        `${TO_PROTOCOL}://${TO_HOST}:${TO_PORT}${url}`,
        {
          body,
          headers: { ...headers, host: TO_HOST },
          followRedirect: false,
          decompress: false,
        }
      );
      const _res = {
        status: response.statusCode,
        body: response.body,
        headers: response.headers,
      };
      socket.emit(responseKey, _res);
      addLog(
        `POST ${url.substring(0, 80)} ${chalk.green(response.statusCode)}`
      );
    } catch (err) {
      socket.emit(responseKey, {
        status: err.response?.statusCode || 404,
        headers: err.response?.headers,
        body: err.response?.body,
      });
      addLog(
        `POST ${url.substring(0, 80)} ${chalk.red(
          err.response?.statusCode || "404"
        )}`
      );
    }
  });
};
