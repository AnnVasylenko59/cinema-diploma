const winston = require('winston');

const customLevels = {
    levels: {
        critical: 0,
        error: 1,
        warning: 2,
        info: 3,
        debug: 4
    },
    colors: {
        critical: 'red',
        error: 'magenta',
        warning: 'yellow',
        info: 'green',
        debug: 'blue'
    }
};

winston.addColors(customLevels.colors);

const customFormat = winston.format.printf(({ timestamp, level, message, moduleName }) => {
    const moduleLabel = moduleName ? `[${moduleName}]` : '[App]';
    return `${timestamp} | ${level.toUpperCase()} | ${moduleLabel} | ${message}`;
});

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize({ all: true }),
        customFormat
    ),
    transports: [
        new winston.transports.Console()
    ],
});

module.exports = logger;