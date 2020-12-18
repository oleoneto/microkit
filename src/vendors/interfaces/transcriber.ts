import {PassThrough} from 'stream'

export const EVENTS = {
  CLOSE: 'close',
  CLOSED: 'closed',
  DATA: 'data',
  DONE: 'done',
  END: 'end',
  ERROR: 'error',
  OPEN: 'open',
  READY: 'ready',
  LISTENING: 'listening',
  MESSAGE: 'message',
  START: 'start',
}

export default interface Transcriber {
  description: string;
  duplex: PassThrough;

  process(data: any): void;
  isActive(): boolean;
  close(): void;
  end(): void;
}
