/* eslint-disable no-console */
import Transcriber, {EVENTS} from '../../vendors/interfaces/transcriber'
import {groupBy} from '../array/group-by'

const dgram = require('dgram')
const EventsEmitter = require('events')
const {pipe} = require('stream').prototype

export default class RTPServer extends EventsEmitter {
  server: any;

  protected port: number;

  protected shouldLog: boolean;

  protected showPackets: boolean;

  protected showInfo: boolean;

  protected listener: any;

  protected buffer: any[];

  public isRunning = false

  constructor(args: {
    port: number;
    shouldLog: boolean;
    showPackets?: boolean;
    showInfo?: boolean;
  }, listener?: Transcriber) {
    super()
    this.server = dgram.createSocket('udp4')
    this.server.pipe = pipe

    this.port = args.port
    this.shouldLog = args.shouldLog
    this.showPackets = Boolean(args.showPackets)
    this.showInfo = Boolean(args.showInfo)
    this.buffer = []

    this.listener = listener

    this.server.on(EVENTS.ERROR, (err: any) => {
      console.error(err)
      this.server.close()
    })
    this.server.on(EVENTS.CLOSE, () => {
      this.emit(EVENTS.DONE)
      this.isRunning = false
      if (this.showPackets) this.processBuffer()
      console.log('\n⚡️ RTP server connection closed. Buffer size: ', this.buffer.length)
    })
    this.server.on(EVENTS.LISTENING, () => {
      this.emit(EVENTS.READY)
      this.emit(EVENTS.LISTENING)
      this.isRunning = true
      console.log(`⚡️ RTP server started at ${this.port}`)
      if (this.listener) this.pipe(this.listener)
    })

    // eslint-disable-next-line no-unused-vars
    this.server.on(EVENTS.MESSAGE, (message: string | any[], remoteInfo: any) => {
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
      this.buffer.push({port, data})
      this.server.emit(EVENTS.DATA, data)
      this.emit(EVENTS.DATA, data, message)

      if (this.showInfo) console.log(remoteInfo)
      if (this.showPackets) console.log(data)
    })

    this.server.bind(this.port)

    process.on('SIGINT', () => {
      this.emit(EVENTS.DONE)
      this.close()
    })
  }

  close() {
    this.server.close()
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

  pipe(transcriber: Transcriber) {
    this.server.pipe(transcriber.stream)
  }
}
