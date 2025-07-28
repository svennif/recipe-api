import fs from 'fs/promises';
import path from 'path';

class AsyncLogger {
  constructor(logFilePath = 'logs/app.log') {
    this.logFilePath = logFilePath;
    this.isVercel = process.env.VERCEL === '1';

    if (!this.isVercel) {
      this.ensureLogDirectory();
    }
  }

  async ensureLogDirectory() {
    try {
      const dir = path.dirname(this.logFilePath);
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error('Failed to create log directory');
    }
  }

  async log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata
    };

    const logLine = JSON.stringify(logEntry);

    if (this.isVercel) {
      // On Vercel, use console logging - Vercel captures these
      console.log(logLine);
    } else {
      // Local development - write to file
      try {
        await fs.appendFile(this.logFilePath, logLine + '\n');
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  async info(message, metadata) {
    return this.log('info', message, metadata);
  }

  async error(message, metadata) {
    return this.log('error', message, metadata);
  }

  async warn(message, metadata) {
    return this.log('warn', message, metadata);
  }

  async debug(message, metadata) {
    return this.log('debug', message, metadata);
  }
}

export const logger = new AsyncLogger();