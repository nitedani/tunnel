var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import express from "express";
import bp from "body-parser";
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import net from "net";
import ss from "@sap_oss/node-socketio-stream";
var randomInteger = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
var createNetTunnel = function (_a) {
    var PORT = _a.PORT, IO_SOCKET = _a.IO_SOCKET;
    return new Promise(function (resolve, reject) {
        var server = net.createServer(function (netSocket) {
            var id = crypto.randomBytes(20).toString("hex");
            var connectionId = "tcp_" + id;
            var socketStream = ss.createStream();
            ss(IO_SOCKET).emit("tcp_connection", {
                connectionId: connectionId,
                remoteAddress: netSocket.remoteAddress,
            }, socketStream);
            netSocket.on("error", function () {
                socketStream.end();
            });
            socketStream.pipe(netSocket);
            netSocket.pipe(socketStream);
        });
        IO_SOCKET.on("disconnect", function () { return server.close(); });
        return server.listen(PORT).once("listening", resolve).once("error", reject);
    });
};
export var listen = function (_a) {
    var PORT = _a.PORT;
    var app = express();
    app.use(bp.raw({ type: "*/*" }));
    var server = http.createServer(app);
    var io = new Server(server);
    app.get("*", function (req, res) {
        var room = req.headers.host;
        var sockets = io.sockets.adapter.rooms.get(room);
        if (sockets) {
            var socket = io.sockets.sockets.get(sockets.values().next().value);
            console.log("Tunneling GET - " + req.originalUrl + " to " + socket.id);
            var _req = {
                url: req.originalUrl,
                headers: req.headers,
            };
            var socketStream = ss.createStream();
            ss(socket).emit("get", _req, socketStream);
            socketStream.pipe(res.socket);
            res.socket.pipe(socketStream);
        }
        else {
            res.status(404);
            res.send({ error: "No clients found" });
        }
    });
    app.post("*", function (req, res) {
        var e_1, _a;
        var room = req.headers.host;
        var sockets = io.sockets.adapter.rooms.get(room);
        if (sockets) {
            console.log("Tunneling POST - " + req.originalUrl + " to " + sockets.size + " clients");
            var id = crypto.randomBytes(20).toString("hex");
            var responseKey_1 = "res_" + id;
            try {
                for (var _b = __values(sockets.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var socket = _c.value;
                    io.sockets.sockets.get(socket).on(responseKey_1, function (_res) {
                        var e_2, _a;
                        res.set(_res.headers);
                        res.status(_res.status);
                        res.send(_res.body);
                        try {
                            for (var _b = (e_2 = void 0, __values(sockets.values())), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _socket = _c.value;
                                io.sockets.sockets.get(_socket).removeAllListeners(responseKey_1);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var _req = {
                url: req.originalUrl,
                headers: req.headers,
                body: Object.keys(req.body).length !== 0 ? req.body : undefined,
                responseKey: responseKey_1,
            };
            io.to(room).emit("post", _req);
        }
        else {
            res.status(404);
            res.send({ error: "No clients found" });
        }
    });
    io.on("connection", function (socket) {
        console.log("io socket connected");
        socket.on("register_http_listener", function (_, ack) {
            socket.join(socket.handshake.headers.host);
        });
        socket.on("register_tcp_listener", function (_a, ack) {
            var preferredPort = _a.preferredPort;
            return __awaiter(void 0, void 0, void 0, function () {
                var NET_PORT, err_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            NET_PORT = preferredPort || randomInteger(10000, 20000);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, createNetTunnel({
                                    PORT: NET_PORT,
                                    IO_SOCKET: socket,
                                })];
                        case 2:
                            _b.sent();
                            console.log("tcp server listening on *:" + NET_PORT);
                            ack({ port: NET_PORT });
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _b.sent();
                            ack({ err: err_1 });
                            console.log(err_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        });
    });
    server.listen(PORT, function () {
        console.log("tunnelr listening on *:" + PORT);
    });
};
