import express from "express";
import bp from "body-parser";
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import net from "net";
import ss from "@sap_oss/node-socketio-stream";

const randomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createNetTunnel = ({ PORT, IO_SOCKET }) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer((netSocket) => {
      const id = crypto.randomBytes(20).toString("hex");
      const connectionId = `tcp_${id}`;
      const socketStream = ss.createStream();
      ss(IO_SOCKET).emit(
        "tcp_connection",
        {
          connectionId,
          remoteAddress: netSocket.remoteAddress,
        },
        socketStream
      );
      socketStream.pipe(netSocket);
      netSocket.pipe(socketStream);
    });

    IO_SOCKET.on("disconnect", () => server.close());

    return server.listen(PORT).once("listening", resolve).once("error", reject);
  });
};

export const listen = ({ PORT }) => {
  const app = express();
  app.use(bp.raw({ type: "*/*" }));

  const server = http.createServer(app);
  const io = new Server(server);
  app.get("*", (req, res) => {
    const room = req.headers.host;
    const sockets = io.sockets.adapter.rooms.get(room);

    if (sockets) {
      const socket = io.sockets.sockets.get(sockets.values().next().value);
      console.log(`Tunneling GET - ${req.originalUrl} to ${socket!.id}`);
      const _req = {
        url: req.originalUrl,
        headers: req.headers,
      };
      const socketStream = ss.createStream();
      ss(socket).emit("get", _req, socketStream);
      socketStream.pipe(res.socket);
      res.socket.pipe(socketStream);
    } else {
      res.status(404);
      res.send({ error: "No clients found" });
    }
  });

  app.post("*", (req, res) => {
    const room = req.headers.host;
    const sockets = io.sockets.adapter.rooms.get(room);

    if (sockets) {
      console.log(
        `Tunneling POST - ${req.originalUrl} to ${sockets.size} clients`
      );
      const id = crypto.randomBytes(20).toString("hex");
      const responseKey = `res_${id}`;
      for (const socket of sockets.values()) {
        io.sockets.sockets.get(socket)!.on(responseKey, (_res) => {
          res.set(_res.headers);
          res.status(_res.status);
          res.send(_res.body);

          for (const _socket of sockets.values()) {
            io.sockets.sockets.get(_socket)!.removeAllListeners(responseKey);
          }
        });
      }

      const _req = {
        url: req.originalUrl,
        headers: req.headers,
        body: Object.keys(req.body).length !== 0 ? req.body : undefined,
        responseKey,
      };

      io.to(room).emit("post", _req);
    } else {
      res.status(404);
      res.send({ error: "No clients found" });
    }
  });

  io.on("connection", (socket) => {
    console.log("io socket connected");

    socket.on("register_http_listener", (_, ack) => {
      socket.join(socket.handshake.headers.host!);
    });

    socket.on("register_tcp_listener", async ({ preferredPort }, ack) => {
      const NET_PORT = preferredPort || randomInteger(10000, 20000);
      try {
        await createNetTunnel({
          PORT: NET_PORT,
          IO_SOCKET: socket,
        });
        console.log(`tcp server listening on *:${NET_PORT}`);

        ack({ port: NET_PORT });
      } catch (err) {
        ack({ err });
        console.log(err);
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`tunnelr listening on *:${PORT}`);
  });
};
