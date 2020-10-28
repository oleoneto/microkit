/* eslint-disable no-console */
import {EVENTS} from '../../vendors/interfaces/transcriber'
import {groupBy} from '../array/group-by'
import {Socket} from 'dgram'

const dgram = require('dgram')
const EventsEmitter = require('events')

export default class VoiceServer extends EventsEmitter {
  server: Socket;

  protected port: number;

  protected buffer: any[] = [];

  constructor(port: number) {
    super()
    this.server = dgram.createSocket('udp4')

    this.port = port

    this.server.on(EVENTS.ERROR, (err: any) => {
      console.error(err)
      this.server.close()
    })

    this.server.on(EVENTS.CLOSE, () => {
      this.emit(EVENTS.DONE)
      console.log('\n⚡️ Voice server connection closed. Buffer size: ', this.buffer.length)
    })

    this.server.on(EVENTS.LISTENING, () => {
      this.emit(EVENTS.READY)
      if (this.listener) this.pipe(this.listener)
      console.log(`⚡️ Voice server started at ${this.port}`)
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
      this.emit(EVENTS.DATA, data, message)
    })

    this.server.bind(this.port)

    process.on('SIGINT', () => {
      this.emit('close')
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
