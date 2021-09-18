export declare const command = "tcp [to]";
export declare const desc = "Start tunnelr tcp client";
export declare const builder: {
    preferredPort: {
        default: string | undefined;
    };
    to: {
        default: string;
    };
    provider: {
        default: string;
    };
    secure: {
        describe: string;
        type: string;
        default: boolean;
    };
};
export declare const handler: (argv: any) => Promise<void>;
