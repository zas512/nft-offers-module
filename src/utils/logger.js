const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgCyan: "\x1b[46m",
  bgMagenta: "\x1b[45m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m"
};

const formatTime = () => {
  const d = new Date();
  return `${colors.gray}${d.toISOString().slice(11, 23)}${colors.reset}`;
};

const getMethodColor = (method) => {
  switch (method.toUpperCase()) {
    case "GET":
      return `${colors.green}${colors.bold}${method}${colors.reset}`;
    case "POST":
      return `${colors.cyan}${colors.bold}${method}${colors.reset}`;
    case "PUT":
    case "PATCH":
      return `${colors.yellow}${colors.bold}${method}${colors.reset}`;
    case "DELETE":
      return `${colors.red}${colors.bold}${method}${colors.reset}`;
    default:
      return `${colors.magenta}${colors.bold}${method}${colors.reset}`;
  }
};

const getStatusColor = (status) => {
  if (status >= 200 && status < 300) {
    return `${colors.green}${colors.bold}${status}${colors.reset}`;
  }
  if (status >= 300 && status < 400) {
    return `${colors.cyan}${colors.bold}${status}${colors.reset}`;
  }
  if (status >= 400 && status < 500) {
    return `${colors.yellow}${colors.bold}${status}${colors.reset}`;
  }
  return `${colors.red}${colors.bold}${status}${colors.reset}`;
};

const formatDataPreview = (data) => {
  if (!data || Object.keys(data).length === 0) {
    return "";
  }
  try {
    const serialized = JSON.stringify(data);
    const truncated = serialized.length > 200 ? `${serialized.slice(0, 197)}...` : serialized;
    return `${colors.dim}${truncated}${colors.reset}`;
  } catch {
    return "";
  }
};

export const logger = {
  info(message, meta = null) {
    const metaStr = meta ? ` ${formatDataPreview(meta)}` : "";
    console.log(`${formatTime()} ${colors.cyan}[INFO]${colors.reset} ${message}${metaStr}`);
  },
  flow(step, description, data = null) {
    const tag = `${colors.magenta}[FLOW ➔ ${step}]${colors.reset}`;
    const desc = `${colors.white}${description}${colors.reset}`;
    const preview =
      data ? `\n       ${colors.gray}└─ Data:${colors.reset} ${formatDataPreview(data)}` : "";
    console.log(`${formatTime()} ${tag} ${desc}${preview}`);
  },
  http(method, path, status, durationMs, details = null) {
    const methodFormatted = getMethodColor(method);
    const statusFormatted = getStatusColor(status);
    const timing = `${colors.gray}+${durationMs}ms${colors.reset}`;
    const extra = details ? ` ${formatDataPreview(details)}` : "";
    console.log(
      `${formatTime()} ${colors.blue}[HTTP]${colors.reset} ${methodFormatted} ${colors.bold}${path}${colors.reset} ${statusFormatted} ${timing}${extra}`
    );
  }
};
export function requestFlowLogger(req, res, next) {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const incomingData = {
    ...(Object.keys(req.params || {}).length ? { params: req.params } : {}),
    ...(Object.keys(req.query || {}).length ? { query: req.query } : {}),
    ...(req.body && Object.keys(req.body).length ? { body: req.body } : {})
  };
  console.log(
    `${formatTime()} ${colors.blue}[API IN]${colors.reset} ${getMethodColor(method)} ${colors.bold}${url}${colors.reset} ${formatDataPreview(incomingData)}`
  );
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(method, url, res.statusCode, duration);
  });
  next();
}
