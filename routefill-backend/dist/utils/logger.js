"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/**
 * Standardized console logger with timestamps and log levels.
 */
exports.logger = {
    info: (msg, meta) => {
        console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta !== undefined ? meta : '');
    },
    warn: (msg, meta) => {
        console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, meta !== undefined ? meta : '');
    },
    error: (msg, meta) => {
        console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, meta !== undefined ? meta : '');
    },
    debug: (msg, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[${new Date().toISOString()}] [DEBUG] ${msg}`, meta !== undefined ? meta : '');
        }
    },
};
