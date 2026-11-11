// Extend global CloudflareEnv so cfContext.env.HYPERDRIVE has proper typing.
export { };

declare global {
    interface CloudflareEnv {
        HYPERDRIVE: {
            connectionString: string;
        };
    }
}