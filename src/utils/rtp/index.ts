/* eslint-disable no-console */
import Transcriber, {EVENTS} from '../../vendors/interfaces/transcriber'
import {groupBy} from '../array/group-by'
import {Socket} from 'dgram'

const dgram = require('dgram')
const EventsEmitter = require('events')

export default class RTPServer extends EventsEmitter {
  server: Socket;

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
      console.log('\n⚡️ RTP server connection closed. Buffer size: ', this.buffer.length)
    })
    this.server.on('listening', () => {
      this.emit(EVENTS.READY)
      this.emit(EVENTS.LISTENING)
      this.isRunning = true
      console.log(`⚡️ RTP server started at ${this.port}`)
      if (this.listener) this.pipe(this.listener)
    })

    // eslint-disable-next-line no-unused-vars
    this.server.on('message', (message: string | any[], remoteInfo: any) => {
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
      this.processBuffer()
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
    const processed = groupBy('port', this.buffer)
    console.log(processed)
  }
}
