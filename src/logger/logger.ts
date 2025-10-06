import winston from 'winston';

// Type-safe log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

// Define your severity levels.
// Available log levels (from lowest to highest priority):
// - debug: 4 - Detailed information for debugging
// - http: 3 - HTTP requests/responses
// - info: 2 - General information
// - warn: 1 - Warning messages
// - error: 0 - Error messages only
//
// Set LOG_LEVEL environment variable to control logging:
// LOG_LEVEL=error (only errors), LOG_LEVEL=info (info, warn, error), etc.
const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuration interface for better structure
interface LoggerConfig {
  level: LogLevel;
  source: 'LOG_LEVEL env var' | 'NODE_ENV fallback';
  isValid: boolean;
}

// This method determines the current severity based on
// the LOG_LEVEL environment variable or fallback to NODE_ENV behavior
const getLoggerConfig = (): LoggerConfig => {
  const validLevels = Object.keys(levels) as LogLevel[];

  // Check if LOG_LEVEL is explicitly set
  if (process.env.LOG_LEVEL) {
    const logLevel = process.env.LOG_LEVEL.toLowerCase() as LogLevel;

    // Validate that the log level is supported
    if (validLevels.includes(logLevel)) {
      return {
        level: logLevel,
        source: 'LOG_LEVEL env var',
        isValid: true,
      };
    }

    // Invalid LOG_LEVEL provided - we'll log this later with winston
    return {
      level: getDefaultLevel(),
      source: 'NODE_ENV fallback',
      isValid: false,
    };
  }

  // No LOG_LEVEL set, use NODE_ENV fallback
  return {
    level: getDefaultLevel(),
    source: 'NODE_ENV fallback',
    isValid: true,
  };
};

// Get default level based on NODE_ENV
const getDefaultLevel = (): LogLevel => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Define different colors for each level.
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
// defined above to the severity levels.
winston.addColors(colors);

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  // Add the message timestamp with the preferred format
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // Define the format of the message showing the timestamp, the level, component and the message
  winston.format.printf((info) => {
    const component = info.component ? `[${info.component}]` : '';
    const level = info.level.toUpperCase();

    // Extract metadata (everything except the standard winston fields)
    const standardFields = ['timestamp', 'level', 'message', 'component'];
    const meta = Object.keys(info)
      .filter((key) => !standardFields.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = info[key];
          return obj;
        },
        {} as Record<string, unknown>,
      );

    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';

    return `[${info.timestamp}] ${level} ${component}: ${info.message}${metaStr}`;
  }),
  // Apply colors after formatting
  winston.format.colorize({ all: true }),
);

// Define which transports the logger must use to print out messages.
// In this example, we are using three different transports
const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Allow to print all the error message inside the all.log file
  // (also the error log that are also printed inside the error.log(
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Get logger configuration
const config = getLoggerConfig();

// Create the logger instance that has to be exported
// and used to log messages.
const Logger = winston.createLogger({
  level: config.level,
  levels,
  format,
  transports,
});

// Function to log initial configuration information
const logInitialConfig = (logger: winston.Logger) => {
  const config = getLoggerConfig();

  // Log invalid LOG_LEVEL warning if needed
  if (!config.isValid && process.env.LOG_LEVEL) {
    logger.warn(`Invalid LOG_LEVEL: ${process.env.LOG_LEVEL}. Using default level.`);
  }

  logger.info(`Logger initialized with level: ${config.level} (from ${config.source})`);
};

// Export both the logger and the initialization function
export { logInitialConfig };
export default Logger;
