"use strict";
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listen = void 0;
var tty_1 = require("tty");
var pretty_bytes_1 = __importDefault(require("pretty-bytes"));
var chalk_1 = __importDefault(require("chalk"));
var socket_io_client_1 = require("socket.io-client");
var cli_table_1 = __importDefault(require("cli-table"));
var net_1 = __importDefault(require("net"));
var node_socketio_stream_1 = __importDefault(require("@sap_oss/node-socketio-stream"));
exports.listen = function (_a) {
    var PROVIDER = _a.PROVIDER, TO_PROTOCOL = _a.TO_PROTOCOL, TO_PORT = _a.TO_PORT, TO_HOST = _a.TO_HOST, SECURE = _a.SECURE, PREFERRED_PORT = _a.PREFERRED_PORT;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, PROVIDER_HOST, netSockets, tty, IO_PROTOCOL, socket, error, reconnecting, logs, NET_PORT, writeStatus, updateConsole;
        return __generator(this, function (_c) {
            _b = __read(PROVIDER.split(":"), 1), PROVIDER_HOST = _b[0];
            netSockets = {};
            tty = tty_1.isatty(process.stdout.fd);
            IO_PROTOCOL = SECURE ? "https" : "http";
            socket = socket_io_client_1.io(IO_PROTOCOL + "://" + PROVIDER);
            error = "";
            reconnecting = false;
            logs = [];
            NET_PORT = "";
            socket.on("connect_error", function (err) {
                reconnecting = true;
                error = err.message;
                updateConsole();
            });
            socket.on("connect", function () {
                reconnecting = false;
                socket.emit("register_tcp_listener", { preferredPort: PREFERRED_PORT }, function (_a) {
                    var port = _a.port, err = _a.err;
                    if (err) {
                        console.error(err);
                        process.exit();
                    }
                    NET_PORT = port;
                    updateConsole();
                });
                updateConsole();
            });
            socket.on("disconnect", function () {
                reconnecting = true;
                netSockets = {};
                updateConsole();
            });
            setInterval(function () {
                updateConsole();
                if (socket.disconnected) {
                    reconnecting = true;
                    socket.connect();
                }
            }, 5000);
            writeStatus = function () {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                var table = new cli_table_1.default();
                if (socket.connected) {
                    table.push((_a = {},
                        _a[chalk_1.default.white("Status")] = chalk_1.default.green("Live"),
                        _a));
                    if (NET_PORT) {
                        table.push((_b = {},
                            _b[chalk_1.default.white("Forwarding")] = "tcp://" + PROVIDER_HOST + ":" + NET_PORT + " -> tcp://" + TO_HOST + ":" + TO_PORT,
                            _b));
                        var connectedNetSockets = Object.values(netSockets).filter(function (netSocket) { return !netSocket.connecting && !netSocket.destroyed; }).length;
                        var bytesRead = Object.values(netSockets).reduce(function (acc, curr) { return acc + curr.bytesRead; }, 0);
                        var bytesWritten = Object.values(netSockets).reduce(function (acc, curr) { return acc + curr.bytesWritten; }, 0);
                        table.push((_c = {},
                            _c[chalk_1.default.white("Connections")] = connectedNetSockets,
                            _c), (_d = {},
                            _d[chalk_1.default.white("Read")] = pretty_bytes_1.default(bytesRead),
                            _d), (_e = {},
                            _e[chalk_1.default.white("Written")] = pretty_bytes_1.default(bytesWritten),
                            _e));
                    }
                }
                else {
                    if (reconnecting) {
                        table.push((_f = {},
                            _f[chalk_1.default.white("Status")] = chalk_1.default.yellow("Reconnecting"),
                            _f));
                    }
                    else {
                        table.push((_g = {},
                            _g[chalk_1.default.white("Status")] = chalk_1.default.red("Disconnected"),
                            _g));
                        if (error) {
                            table.push((_h = {},
                                _h[chalk_1.default.white("Error")] = chalk_1.default.red(String(error)),
                                _h));
                        }
                    }
                }
                console.log(table.toString());
            };
            updateConsole = function () {
                var e_1, _a;
                if (!tty)
                    return;
                console.clear();
                writeStatus();
                console.log();
                try {
                    for (var logs_1 = __values(logs), logs_1_1 = logs_1.next(); !logs_1_1.done; logs_1_1 = logs_1.next()) {
                        var log = logs_1_1.value;
                        console.log(log);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (logs_1_1 && !logs_1_1.done && (_a = logs_1.return)) _a.call(logs_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            };
            node_socketio_stream_1.default(socket).on("tcp_connection", function (_a, socketStream) {
                var connectionId = _a.connectionId, remoteAddress = _a.remoteAddress;
                var client = new net_1.default.Socket();
                netSockets[connectionId] = client;
                client.connect(TO_PORT, TO_HOST, function () {
                    socket.emit(connectionId + "_connected");
                    updateConsole();
                });
                socketStream.pipe(client);
                client.pipe(socketStream);
            });
            return [2 /*return*/];
        });
    });
};
