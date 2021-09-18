#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs_1 = __importDefault(require("yargs/yargs"));
var helpers_1 = require("yargs/helpers");
var index_1 = require("./cmds/index");
yargs_1.default(helpers_1.hideBin(process.argv))
    .command(index_1.commands)
    .demandCommand()
    .scriptName("tunnelr").argv;
