/**
 * Strukturisani logovi (jedan JSON red po događaju).
 * Pravilo: nikada ne logovati sadržaj poruke, podatke iz forme ni Turnstile token —
 * samo naziv događaja i tehničke oznake (razlog odbijanja, kod greške).
 */

export type LogFields = Record<string, string | number | boolean | string[] | undefined>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

function line(level: string, event: string, fields?: LogFields): string {
  return JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
}

export const consoleLogger: Logger = {
  info: (event, fields) => console.info(line('info', event, fields)),
  warn: (event, fields) => console.warn(line('warn', event, fields)),
  error: (event, fields) => console.error(line('error', event, fields)),
};
