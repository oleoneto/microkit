export const EVENTS = {
  CLOSE: 'close',
  CLOSED: 'closed',
  DATA: 'data',
  DONE: 'done',
  ERROR: 'error',
  OPEN: 'open',
  READY: 'ready',
  LISTENING: 'listening',
  MESSAGE: 'message',
}

export default interface Transcriber {
  description: string;
  stream: any;

  capture(data: any, rawData: any): void;
  process(data: any): void;
  isActive(): boolean;
  close(): void;
  end(): void;
}
