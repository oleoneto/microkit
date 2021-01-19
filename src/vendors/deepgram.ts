/* eslint-disable no-console */
require('dotenv').config()

import {EVENTS} from './interfaces/transcriber'
import Transcriber from './interfaces/transcriber'
import {queryFromObject} from '../utils/query-from-object'
import {formatTranscript} from '../utils/format-transcript'
import {PassThrough} from 'stream'

const WebSocket = require('ws')
const EventsEmitter = require('events')

export default class Deepgram extends EventsEmitter implements Transcriber {
  public stream: any

  public duplex: PassThrough;

  protected socket: WebSocket;

  protected history = '';

  protected buffer: any[] = []

  public description: string

  private transcript = ''

  constructor(timeout: number, description = 'Deepgram') {
    super()

    this.description = description

    const DeepgramOptions = {
      diarize: true,
      // encoding: 'mulaw', // options: linear16, flac, amr-nb (sr: 8000), amr-wb (sr: 16000), opus, speex
      model: 'phonecall', // options: general, meeting, phoneCall
      multichannel: true,
      sample_rate: 16000, // 8000,
      interim_results: false,
      language: 'en-US',
    }

    const {DEEPGRAM_API_KEY, DEEPGRAM_API_SECRET} = process.env
    const URL = `wss://cab2b5852c84ae12.deepgram.com/v2/listen/stream?${queryFromObject(DeepgramOptions)}`
    const CREDENTIALS = Buffer.from(`${DEEPGRAM_API_KEY}:${DEEPGRAM_API_SECRET}`).toString('base64')

    this.socket = new WebSocket(URL, ['Basic', CREDENTIALS])

    // This should capure any data piped in...
    this.duplex = new PassThrough()

    this.duplex._write = (chunk, enc, next) => {
      this.buffer.push(chunk)
      this.socket.send(chunk)
      next()
    }

    this.socket.addEventListener(EVENTS.ERROR, (error: any) => {
      console.error(error)
      this.close()
    })

    this.socket.addEventListener(EVENTS.OPEN, () => {
      console.log('👂 Connected to deepgram')
      console.log(`👂 Deepgram is using binaryType  => ${this.socket.binaryType}`)

      this.emit(EVENTS.READY)

      if (timeout) {
        setTimeout(() => {
          this.end()
          console.log('👂 Connection timeout reached. Closing deepgram.')
        }, timeout * 1000)
      }
    })

    this.socket.addEventListener('message', (message: { data: string }) => this.process(message))

    this.socket.onclose = () => {
      this.showConversation()
      console.log('👂 Deepgram connection closed. Buffer size', this.buffer.length)
      this.emit(EVENTS.DONE)
    }

    process.on('SIGINT', () => {
      if (this.isActive()) this.close()
      else this.showConversation()
      this.emit(EVENTS.DONE)
    })
  }

  process(data: any): void {
    const d = JSON.parse(data.data)
    // eslint-disable-next-line no-prototype-builtins
    if (d.hasOwnProperty('channel')) {
      /**
      * `d.channel.alternatives` is an array with the following structure:
      * [
      *   {
      *     transcript: 'address is one two three new york avenue',
      *     confidence: 0.9918349,
      *     words: [
      *       {
      *         word: 'address',
      *         start: 0.179999999,
      *         end: 0.42,
      *         confidence: 0.42,
      *         speaker: number, // optionally set if diarize is true
      *       },
      *       ...more words
      *     ]
      *   },
      *   ...more alternatives
      * ]
      *
      * */

      const alternative = d.channel.alternatives[0]
      this.transcript = alternative.transcript
      this.history += `${formatTranscript(alternative.transcript)} `

      console.log('=>', this.transcript)
    }
  }

  isActive(): boolean {
    return this.socket.readyState !== this.socket.CLOSED
  }

  end(): void {
    this.socket.send(new Uint8Array(0))
  }

  close(): void {
    this.socket.close()
  }

  log(): void {
    console.log(this.transcript)
  }

  showConversation(): void {
    console.log('================= \n')
    console.log('Final Transcript: \n')
    console.log(this.history.trim())
    console.log('================= \n')
  }
}
