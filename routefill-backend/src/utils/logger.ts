/**
 * Standardized console logger with timestamps and log levels.
 */
export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, meta !== undefined ? meta : '');
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, meta !== undefined ? meta : '');
  },
  error: (msg: string, meta?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, meta !== undefined ? meta : '');
  },
  debug: (msg: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${msg}`, meta !== undefined ? meta : '');
    }
  },
};
