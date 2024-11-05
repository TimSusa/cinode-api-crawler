export class Logger {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  debug(...logContent: any[]) {
    console.debug(`[DEBUG] [${this.name}]`, logContent);
  }

  info(...logContent: any[]) {
    console.log(`[INFO] [${this.name}]`, logContent);
  }

  warn(...logContent: any[]) {
    console.warn(`[WARN] [${this.name}]`, logContent);
  }

  error(...logContent: any[]) {
    console.error(`[ERROR] [${this.name}]`, logContent);
  }
}
