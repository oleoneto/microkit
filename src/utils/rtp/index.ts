/* eslint-disable no-console */
import Transcriber, {EVENTS} from '../../vendors/interfaces/transcriber'
import {PassThrough} from 'stream'

const dgram = require('dgram')
const EventsEmitter = require('events')
const {pipe} = require('stream').prototype

export default class RTPServer extends EventsEmitter {
  socket: any;

  protected port: number

  protected shouldLog: boolean

  protected showPackets: boolean

  protected showInfo: boolean

  public listener: any

  protected buffer: any[]

  protected streams: Map<any, any>

  constructor(args: {
    port: number;
    shouldLog: boolean;
    showPackets?: boolean;
    showInfo?: boolean;
  }, listener?: Transcriber) {
    super()

    this.port = args.port
    this.shouldLog = args.shouldLog
    this.showPackets = Boolean(args.showPackets)
    this.showInfo = Boolean(args.showInfo)
    this.buffer = []
    this.streams = new Map()

    this.listener = listener

    this.bind()

    process.on('SIGINT', () => {
      this.emit(EVENTS.DONE)
      this.close()
    })
  }

  bind() {
    this.socket = dgram.createSocket('udp4')
    this.socket.pipe = pipe

    this.socket.on(EVENTS.ERROR, (err: any) => {
      console.error(err)
      this.socket.close()
    })

    this.socket.on(EVENTS.CLOSE, () => {
      this.emit(EVENTS.DONE)
      console.log('\n⚡️ RTP server connection closed. Buffer size: ', this.buffer.length)
      console.log(`\n⚡️ RTP server had ${this.streams.size} connections`)
    })

    this.socket.on(EVENTS.LISTENING, () => {
      this.emit(EVENTS.READY)
      this.emit(EVENTS.LISTENING)
      const address = this.socket.address()

      console.log(`⚡️ RTP server started at ${address.address}:${address.port}`)
      if (this.listener) this.pipe(this.listener)
    })

    this.socket.on(EVENTS.MESSAGE, (message: string | any[], remoteInfo: any) => {
      const data = message.slice(12)

      /**
       * Buffer of the form:
       * [
       *    {
       *      port: 1234,
       *      data: []
       *    },
       *    ...more ports
       * ]
       */

      const port = remoteInfo.port

      let stream: PassThrough = this.streams.get(port)

      if (!stream) stream = this.createStream(port)

      this.buffer.push({port, data})
      stream.write(data)

      if (this.showInfo) console.dir(remoteInfo)
      if (this.showPackets) console.dir(data, {maxArrayLength: null})
    })

    this.socket.bind({port: this.port, exclusive: true})
  }

  createStream(port: number): PassThrough {
    const stream = new PassThrough()
    this.streams.set(port, stream)

    console.log(`⚡️ RTP new streamer connected @ ${port}`)
    return stream
  }

  close() {
    this.socket.close()
  }

  processBuffer() {
    /**
     * Group buffer data as:
     * [
     *    1234: [
     *      { port: 1234, data: []},
     *      ...mode data
     *    ],
     *    ...more ports
     * ]
     */
    // const processed = groupBy('port', this.buffer)
    const processed = this.buffer
    console.dir(processed, {maxArrayLength: null})
  }

  getBuffer() {
    return this.buffer
  }

  pipe(receiver: PassThrough) {
    console.log('⚡️ RTP server started piping stream')
    this.socket.pipe(receiver)
  }
}
