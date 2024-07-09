"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTcpClient = exports.createHttpClient = exports.createServer = void 0;
var server_1 = require("./server/server");
Object.defineProperty(exports, "createServer", { enumerable: true, get: function () { return server_1.listen; } });
var client_http_1 = require("./client/client-http");
Object.defineProperty(exports, "createHttpClient", { enumerable: true, get: function () { return client_http_1.listen; } });
var client_tcp_1 = require("./client/client-tcp");
Object.defineProperty(exports, "createTcpClient", { enumerable: true, get: function () { return client_tcp_1.listen; } });
