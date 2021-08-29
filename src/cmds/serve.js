export const command = "serve [port]";
export const desc = "Start tunnelr server";
export const builder = {
  port: {
    default: 80,
  },
};

export const handler = async (argv) => {
  const { listen } = await import("../server/server.js");
  listen({
    PORT: argv.port,
  });
};
