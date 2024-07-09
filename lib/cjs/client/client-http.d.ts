export interface HttpClientArgs {
    PROVIDER: string;
    ROOM: string;
    TO_PROTOCOL: string;
    TO_HOST: string;
    TO_PORT: number;
    SECURE: boolean;
    TTY?: boolean;
}
export declare const listen: ({ PROVIDER, ROOM, TO_PROTOCOL, TO_HOST, TO_PORT, SECURE, TTY, }: HttpClientArgs) => Promise<void>;
