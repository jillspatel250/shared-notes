import winston from "winston"

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "ai-quizzer-backend" },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  )
}

// Export logger functions
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
}

// Request logging middleware
export function logRequest(req: any, res: any, next: any) {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    log.info("HTTP Request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    })
  })

  next()
}

// Error logging
export function logError(error: Error, context?: string) {
  log.error(`${context ? `[${context}] ` : ""}${error.message}`, {
    stack: error.stack,
    context,
  })
}

// API endpoint logging
export function logAPICall(endpoint: string, method: string, userId?: number, duration?: number) {
  log.info("API Call", {
    endpoint,
    method,
    userId,
    duration: duration ? `${duration}ms` : undefined,
  })
}

export default logger
