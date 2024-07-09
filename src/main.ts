#!/usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from "yargs/helpers";
import { commands } from "./cmds/index";

yargs(hideBin(process.argv))
  .command(commands as any)
  .demandCommand()
  .scriptName("tunnelr").argv;
