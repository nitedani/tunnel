export declare const command = "http [to]";
export declare const desc = "Start tunnelr http client";
export declare const builder: {
    room: {
        default: string;
    };
    to: {
        default: string;
    };
    provider: {
        default: string;
    };
    "dot-domain": {
        describe: string;
        type: string;
        default: boolean;
    };
    secure: {
        describe: string;
        type: string;
        default: boolean;
    };
};
export declare const handler: (argv: any) => Promise<void>;
