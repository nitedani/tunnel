#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from "yargs/helpers";
import { commands } from "./cmds/index";
yargs(hideBin(process.argv))
    .command(commands)
    .demandCommand()
    .scriptName("tunnelr").argv;
