/* eslint-disable no-console */
const dgram = require('dgram')
const pipe = require('stream').prototype.pipe
const EventsEmitter = require('events')

export default class RTPServer extends EventsEmitter {
  private server: any;

  protected address: string;

  protected port: number;

  protected shouldLog: boolean;

  protected listener: any;

  protected buffer: any[];

  public isRunning = false

  constructor(args: { host: any; port: number; shouldLog: boolean }, listener: any | undefined = undefined) {
    super()
    this.server = dgram.createSocket('udp4')
    this.server.pipe = pipe

    this.address = args.host
    this.port = args.port
    this.shouldLog = args.shouldLog
    this.buffer = []

    this.listener = listener

    this.server.on('error', (_err: any) => this.server.close())
    this.server.on('close', () => {
      this.isRunning = false
      console.log('\n⚡️ RTP server connection closed. Buffer size: ', this.buffer.length)
    })
    this.server.on('listening', () => {
      this.emit('ready')
      this.isRunning = true
      console.log(`⚡️ RTP server started at ${this.address}:${this.port}`)
      if (this.listener) this.pipe(this.listener)
    })

    // eslint-disable-next-line no-unused-vars
    this.server.on('message', (message: string | any[]) => {
      const data = message.slice(12)
      this.buffer.push(data)
      this.emit('data', data)
    })

    this.server.bind(this.port, this.address)

    process.on('SIGINT', () => {
      this.emit('close')
      this.close()
    })
  }

  close() {
    this.server.close()
  }

  pipe(destination: any) {
    this.server.pipe(destination)
    console.log('⚡️ RTP server piping data')
  }
}
