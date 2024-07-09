import * as tcp from "./tcp";
import * as http from "./http";
import * as serve from "./serve";
export declare const commands: (typeof tcp | typeof http | typeof serve)[];
