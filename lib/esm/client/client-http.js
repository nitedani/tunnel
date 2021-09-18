var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { isatty } from "tty";
import got from "got";
import chalk from "chalk";
import { io } from "socket.io-client";
import ss from "@sap_oss/node-socketio-stream";
import stream from "stream";
import { promisify } from "util";
import request from "request";
var pipeline = promisify(stream.pipeline);
export var listen = function (_a) {
    var PROVIDER = _a.PROVIDER, TO_PROTOCOL = _a.TO_PROTOCOL, TO_HOST = _a.TO_HOST, TO_PORT = _a.TO_PORT, SECURE = _a.SECURE, TTY = _a.TTY;
    return __awaiter(void 0, void 0, void 0, function () {
        var tty, IO_PROTOCOL, socket, error, reconnecting, logs, addLog, writeStatus, updateConsole;
        return __generator(this, function (_b) {
            tty = TTY === undefined ? isatty(process.stdout.fd) : TTY;
            IO_PROTOCOL = SECURE ? "https" : "http";
            socket = io(IO_PROTOCOL + "://" + PROVIDER);
            error = "";
            reconnecting = false;
            logs = [];
            socket.on("connect_error", function (err) {
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
            setInterval(function () {
                if (socket.disconnected) {
                    reconnecting = true;
                    socket.connect();
                }
            }, 5000);
            addLog = function (log) {
                if (tty) {
                    if (logs.length > 5) {
                        logs.pop();
                    }
                    logs.unshift(log);
                    updateConsole();
                }
                else {
                    console.log(log);
                }
            };
            writeStatus = function () {
                if (socket.connected) {
                    console.log(chalk.green("Live"));
                    console.log("Forwarding   https://" + PROVIDER + " -> " + TO_PROTOCOL + "://" + TO_HOST + ":" + TO_PORT);
                    console.log("Forwarding   http://" + PROVIDER + " -> " + TO_PROTOCOL + "://" + TO_HOST + ":" + TO_PORT);
                }
                else {
                    if (reconnecting) {
                        console.log(chalk.yellow("Reconnecting.."));
                    }
                    else {
                        console.log(chalk.red("Disconnected - " + error));
                    }
                }
            };
            updateConsole = function () {
                var e_1, _a;
                if (tty) {
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
                }
                else {
                    writeStatus();
                }
            };
            ss(socket).on("get", function (_a, socketStream) {
                var url = _a.url, headers = _a.headers;
                request(TO_PROTOCOL + "://" + TO_HOST + ":" + TO_PORT + url, {
                    headers: __assign(__assign({}, headers), { host: TO_HOST }),
                    followRedirect: false,
                })
                    .on("socket", function (sock) {
                    sock.pipe(socketStream);
                    socketStream.pipe(sock);
                })
                    .on("complete", function (response) {
                    var statusCode = response.statusCode;
                    var isOk = statusCode < 400 || statusCode > 500;
                    if (isOk) {
                        addLog("GET " + url.substring(0, 80) + " " + chalk.green(response.statusCode));
                    }
                    else {
                        addLog("GET " + url.substring(0, 80) + " " + chalk.red(response.statusCode));
                    }
                })
                    .on("error", function (err) {
                    addLog("GET " + url.substring(0, 80) + " " + chalk.red(err));
                });
            });
            socket.on("post", function (_a) {
                var url = _a.url, headers = _a.headers, body = _a.body, responseKey = _a.responseKey;
                return __awaiter(void 0, void 0, void 0, function () {
                    var response, _res, err_1;
                    var _b, _c, _d, _e;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                _f.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, got.post(TO_PROTOCOL + "://" + TO_HOST + ":" + TO_PORT + url, {
                                        body: body,
                                        headers: __assign(__assign({}, headers), { host: TO_HOST }),
                                        followRedirect: false,
                                        decompress: false,
                                    })];
                            case 1:
                                response = _f.sent();
                                _res = {
                                    status: response.statusCode,
                                    body: response.body,
                                    headers: response.headers,
                                };
                                socket.emit(responseKey, _res);
                                addLog("POST " + url.substring(0, 80) + " " + chalk.green(response.statusCode));
                                return [3 /*break*/, 3];
                            case 2:
                                err_1 = _f.sent();
                                socket.emit(responseKey, {
                                    status: ((_b = err_1.response) === null || _b === void 0 ? void 0 : _b.statusCode) || 404,
                                    headers: (_c = err_1.response) === null || _c === void 0 ? void 0 : _c.headers,
                                    body: (_d = err_1.response) === null || _d === void 0 ? void 0 : _d.body,
                                });
                                addLog("POST " + url.substring(0, 80) + " " + chalk.red(((_e = err_1.response) === null || _e === void 0 ? void 0 : _e.statusCode) || "404"));
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            });
            return [2 /*return*/];
        });
    });
};
