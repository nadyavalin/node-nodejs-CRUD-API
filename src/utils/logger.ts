import fs from 'fs/promises';
import path from 'path';

const logFilePath = path.resolve(__dirname, '../logs/app.log');

const ensureLogDirectory = async (): Promise<void> => {
  const logDir = path.dirname(logFilePath);
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create log directory: ${error}`);
  }
};

const getTimestamp = (): string => new Date().toISOString();

export const log = async (
  method: string,
  url: string | undefined,
  message: string
): Promise<void> => {
  try {
    const logEntry = `[${getTimestamp()}] [${method}] ${url || 'unknown'} ${message}\n`;
    console.log(logEntry.trim());
    await ensureLogDirectory();
    await fs.appendFile(logFilePath, logEntry);
  } catch (error) {
    console.error(`Failed to write to log file: ${error}`);
  }
};
