const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const customLevels = {
    levels: { critical: 0, error: 1, warning: 2, info: 3, debug: 4 },
    colors: { critical: 'red', error: 'magenta', warning: 'yellow', info: 'green', debug: 'blue' }
};

winston.addColors(customLevels.colors);

const consoleFormat = winston.format.printf(({ timestamp, level, message, moduleName }) => {
    const moduleLabel = moduleName ? `[${moduleName}]` : '[App]';
    return `${timestamp} | ${level.toUpperCase()} | ${moduleLabel} | ${message}`;
});

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
);

// --- РОТАЦІЯ ЛОГІВ ---

const errorRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat
});

const combinedRotateTransport = new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat
});

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize({ all: true }),
                consoleFormat
            )
        }),
        errorRotateTransport,
        combinedRotateTransport
    ],
});

module.exports = logger;