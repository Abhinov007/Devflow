import chalk from "chalk";

const ts = () => new Date().toISOString();

function fmt(level, color, msg, meta) {
  const head = chalk.dim(ts()) + " " + color.bold(level.padEnd(5));
  if (meta === undefined) return `${head} ${msg}`;
  if (typeof meta === "string") return `${head} ${msg} ${chalk.dim(meta)}`;
  try {
    return `${head} ${msg}\n${chalk.dim(JSON.stringify(meta, null, 2))}`;
  } catch {
    return `${head} ${msg} ${chalk.dim(String(meta))}`;
  }
}

export const logger = {
  info(msg, meta) {
    console.log(fmt("INFO", chalk.cyan, msg, meta));
  },
  warn(msg, meta) {
    console.warn(fmt("WARN", chalk.yellow, msg, meta));
  },
  error(msg, meta) {
    console.error(fmt("ERROR", chalk.red, msg, meta));
  },
  success(msg, meta) {
    console.log(fmt("OK", chalk.green, msg, meta));
  },
};

