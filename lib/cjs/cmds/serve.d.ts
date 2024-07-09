export declare const command = "serve [port]";
export declare const desc = "Start tunnelr server";
export declare const builder: {
    port: {
        default: string | number;
    };
};
export declare const handler: (argv: any) => Promise<void>;
