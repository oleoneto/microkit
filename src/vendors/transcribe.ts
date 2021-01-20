/* eslint-disable no-console */
require('dotenv').config()

import Transcriber, {EVENTS} from './interfaces/transcriber'
import {Signature} from '../utils/aws/signature'
import {formatTranscript} from '../utils/format-transcript'
import {fromUtf8, toUtf8} from '@aws-sdk/util-utf8-node'
import {
  EventStreamMarshaller,
  Message,
  MessageHeaderValue,
} from '@aws-sdk/eventstream-marshaller'

import {PassThrough} from 'stream'

const {AWS_ACCESS_KEY_SECRET, AWS_ACCESS_KEY_ID} = process.env

const EventsEmitter = require('events')
const WebSocket = require('ws')

const eventBuilder = new EventStreamMarshaller(toUtf8, fromUtf8)

const config = {
  region: 'us-east-1',
  service: 'transcribe',
  time: new Date(),
  host: 'transcribestreaming.us-east-1.amazonaws.com:8443',
  endpoint: 'wss://transcribestreaming.us-east-1.amazonaws.com:8443',
  uri: '/stream-transcription-websocket',
  accessKeyId: String(AWS_ACCESS_KEY_ID),
  accessKeySecret: String(AWS_ACCESS_KEY_SECRET),
}

export default class AWSTranscribe extends EventsEmitter implements Transcriber {
  public description: string;

  public duplex: PassThrough;

  protected history = '';

  protected buffer: any[] = [];

  protected socket: WebSocket;

  protected showInterimResults: boolean;

  constructor(timeout: number, description = 'AWS Transcribe', showInterimResults = false) {
    super()

    this.description = description

    this.showInterimResults = showInterimResults

    const signature = new Signature()

    const sampleRate = 16000 // getSampleRate(format)

    const signedURL = signature.createWebSocketURL({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.accessKeySecret,
      sampleRate,
    })

    this.socket = new WebSocket(signedURL)

    // NOTE: Some codebases seem to be using arraybuffer,
    // but I could not get it to work that way.
    // /* this.socket.binaryType = 'arraybuffer' */

    this.duplex = new PassThrough()
    this.duplex._write = (chunk, enc, next) => {
      // This could go in .capture()
      chunk.swap16()

      this.capture(chunk)
      this.buffer.push(chunk)
      // console.log(`=> Received ${this.buffer.length} chunks.`)
      next()
    }

    this.socket.addEventListener(EVENTS.MESSAGE, (message: any) => this.process(message))

    this.socket.addEventListener(EVENTS.ERROR, () => this.close())

    this.socket.addEventListener(EVENTS.OPEN, () => {
      console.log('👂 Connected to AWS Transcribe')
      console.log(`👂 AWS Transcribe is using binaryType  => ${this.socket.binaryType}`)
      // console.log(`👂 AWS Transcribe is using codec       => ${format}`)
      console.log(`👂 AWS Transcribe is using sample rate => ${sampleRate}`)
      console.log(`👂 AWS Transcribe is using this url    => ${signedURL}`)
      this.emit(EVENTS.READY)

      if (timeout) {
        setTimeout(() => {
          this.end()
          console.log('👂 Connection timeout reached. Closing AWS Transcribe.')
        }, timeout * 1000)
      }
    })

    this.socket.onclose = () => {
      this.showConversation()
      console.log('👂 AWS transcribe connection closed. Buffer size', this.buffer.length)
      this.emit(EVENTS.DONE)
    }

    process.on('SIGINT', () => {
      console.log('Captured SIGINT')
      if (this.isActive()) {
        this.end()
        console.log('Called end()')
      } else {
        this.showConversation()
      }

      this.emit(EVENTS.DONE)
      console.log('Sent done event')
    })
  }

  getAudioEventMessage(buffer: Uint8Array): Message {
    // wrap the audio data in a JSON envelope
    return {
      body: buffer,
      headers: {
        ':message-type': {
          type: 'string',
          value: 'event',
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent',
        } as MessageHeaderValue,
      },
    }
  }

  showConversation(): void {
    console.log('================= \n')
    console.log('Final Transcript: \n')
    console.log(this.history.trim())
    console.log('================= \n')
  }

  isActive(): boolean {
    return this.socket.readyState !== this.socket.CLOSED
  }

  end(): void {
    const emptyMessage = this.getAudioEventMessage(Buffer.from([]))
    const emptyBuffer = eventBuilder.marshall(emptyMessage)
    this.socket.send(emptyBuffer)
  }

  close(): void {
    this.emit(EVENTS.DONE)
    this.socket.close()
  }

  process(data: any) {
    const {fromCharCode} = String
    const messageWrapper = eventBuilder.unmarshall(Buffer.from(data.data))
    const messageBody = JSON.parse(fromCharCode.apply(String, messageWrapper.body as any))

    if (messageWrapper.headers[':message-type'].value === 'event') {
      if (messageBody.Transcript.Results?.length) {
        const result = messageBody.Transcript.Results[0]
        const transcript = result.Alternatives[0]?.Transcript || ''

        if (result && !result.IsPartial) {
          this.history += `${formatTranscript(transcript)} `
        }

        if (this.showInterimResults) {
          console.log('=>', transcript)
        } else if (!result.IsPartial) {
          console.log('=>', transcript)
        }
      }
    } else {
      console.log('👂 AWS Transcribe encountered an error.', messageBody.Message)
    }
  }

  capture(data: ArrayBuffer): void {
    try {
      // => convert the JSON object
      const audioEventJSONMessage = this.getAudioEventMessage(Buffer.from(data))
      // => headers into a binary event stream message
      const binary = eventBuilder.marshall(audioEventJSONMessage)
      this.socket.send(binary)
    } catch (error) {
      console.error(error)
    }
  }
}
