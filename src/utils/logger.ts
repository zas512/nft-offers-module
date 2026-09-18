import type { NextFunction, Request, Response } from "express";

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

export class Logger {
  private static formatTime(): string {
    const d = new Date();
    return `${colors.gray}${d.toISOString().slice(11, 23)}${colors.reset}`;
  }
  private static getMethodColor(method: string): string {
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
  }
  private static getStatusColor(status: number): string {
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
  }
  private static formatDataPreview(data: unknown): string {
    if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) {
      return "";
    }
    try {
      const serialized = JSON.stringify(data);
      const truncated = serialized.length > 200 ? `${serialized.slice(0, 197)}...` : serialized;
      return `${colors.dim}${truncated}${colors.reset}`;
    } catch {
      return "";
    }
  }
  public info(message: string, meta: unknown = null): void {
    const metaStr = meta ? ` ${Logger.formatDataPreview(meta)}` : "";
    console.log(`${Logger.formatTime()} ${colors.cyan}[INFO]${colors.reset} ${message}${metaStr}`);
  }
  public http(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    details: unknown = null
  ): void {
    const methodFormatted = Logger.getMethodColor(method);
    const statusFormatted = Logger.getStatusColor(status);
    const timing = `${colors.gray}+${durationMs}ms${colors.reset}`;
    const extra = details ? ` ${Logger.formatDataPreview(details)}` : "";
    console.log(
      `${Logger.formatTime()} ${colors.blue}[HTTP]${colors.reset} ${methodFormatted} ${colors.bold}${path}${colors.reset} ${statusFormatted} ${timing}${extra}`
    );
  }
  public error(message: string, error?: unknown): void {
    let errStr = "";
    if (error) {
      const errorContent = error instanceof Error ? error.stack : JSON.stringify(error);
      errStr = `\n${colors.red}${errorContent}${colors.reset}`;
    }
    console.error(`${Logger.formatTime()} ${colors.red}[ERROR]${colors.reset} ${message}${errStr}`);
  }
}

export const logger = new Logger();
export function requestFlowLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const incomingData = {
    ...(Object.keys(req.params || {}).length ? { params: req.params } : {}),
    ...(Object.keys(req.query || {}).length ? { query: req.query } : {}),
    ...(req.body && Object.keys(req.body).length ? { body: req.body } : {})
  };
  logger.info(`[API IN] ${method} ${url}`, Object.keys(incomingData).length ? incomingData : null);
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(method, url, res.statusCode, duration);
  });
  next();
}
