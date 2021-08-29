export const parseTo = (to) => {
  let [TO_HOST, TO_PORT] = String(to).split(":");

  if (!isNaN(TO_HOST)) {
    TO_PORT = TO_HOST;
    TO_HOST = "localhost";
  }

  if (!TO_PORT) {
    TO_PORT = 80;
  }

  return `${TO_HOST}:${TO_PORT}`;
};
