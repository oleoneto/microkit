import {PassThrough} from 'stream'

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
  duplex: PassThrough;

  capture(data: ArrayBuffer): void;
  process(data: any): void;
  isActive(): boolean;
  close(): void;
  end(): void;
}
