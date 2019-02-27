'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * This module provides a Winston logger service.
 * It uses the file paths specified in the supplied
 * configuration file.
 */
const modulename = __filename.slice(__filename.lastIndexOf('\\'));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = debug_1.default('PP_' + modulename);
debug(`Starting ${modulename}`);
/* external dependencies */
const winston = tslib_1.__importStar(require("winston"));
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;
const fs = tslib_1.__importStar(require("fs"));
/**
 * Usage:
 *
 * Add...
 * import { Logger } from '<path to>logger';
 * logger = Logger.getInstance(config);
 *
 * where 'config' is a javascript object containing required logger
 * configuration parameters - see the 'Winston logger parameters' section in
 * .config.js.
 *
 * This module can be required in the main application module and the
 * logger object passed downstream.
 * Also once this module is imported then all subsequent imports get the same
 * object, irrespective of the config parameter passed in.  Thus you can
 * set up Logger in the main module and add...
 * logger = Logger.getInstance(); in other modules,
 * i.e. with no dependency on the configuration file.
 *
 * Then...
 * Use logger.info('text') to log 'text' to the info file,
 * and to console.log if not in production.
 * Use logger.error('text') to log 'text' to the info and error file,
 * and to console.log if not in production.
 *
 * format is <timestamp> [PP] <info/error> <message>
 */
class Logger {
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    constructor(config) {
        if (!Logger.instance) {
            Logger.instance = makeLogger(config);
        }
        return Logger.instance;
    }
}
exports.Logger = Logger;
function makeLogger(config) {
    debug(modulename + ': running logger');
    /* log paths */
    const arPaths = [];
    const infoFile = config.INFO_LOG;
    const errorFile = config.ERROR_LOG;
    arPaths.push(infoFile, errorFile);
    /* create files if they don't exist */
    for (const file of arPaths) {
        try {
            /* create file and write '' or fail if it exists */
            fs.writeFileSync(file, '', { flag: 'wx' });
        }
        catch (err) {
            if (err.code === 'EEXIST') {
                /* file exists */
            }
            else {
                /* unexpected error */
                throw err;
            }
        }
    }
    // tslint:disable-next-line: arrow-parens
    const myFormat = printf((info) => {
        return (`${info.timestamp} [${info.label}] ` + `${info.level}: ${info.message}`);
    });
    const myLevels = {
        colors: {
            debug: 'green',
            error: 'bold red',
            info: 'underline yellow',
        },
        levels: {
            debug: 2,
            error: 0,
            info: 1,
        },
    };
    winston.addColors(myLevels.colors);
    const options = {
        console: {
            format: combine(winston.format.colorize({ all: true }), label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: false,
            level: 'debug',
        },
        errorFile: {
            filename: errorFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: true,
            json: true,
            level: 'error',
            maxFiles: 5,
            maxsize: 5242880,
        },
        infoFile: {
            filename: infoFile,
            format: combine(label({ label: 'PP' }), timestamp(), winston.format.align(), myFormat),
            handleExceptions: false,
            json: true,
            level: 'info',
            maxFiles: 5,
            maxsize: 5242880,
        },
    };
    const logger = createLogger({
        levels: myLevels.levels,
        transports: [
            new transports.File(options.errorFile),
            new transports.File(options.infoFile),
        ],
    });
    /* add console.log only if development environment */
    /* using config setting which sets environment in runServer */
    if (config.ENV !== 'production') {
        logger.add(new transports.Console(options.console));
    }
    return logger;
}
//# sourceMappingURL=logger.js.map