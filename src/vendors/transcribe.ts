/* eslint-disable no-console */
require('dotenv').config()

import Transcriber, {EVENTS} from './interfaces/transcriber'
import {Signature} from '../utils/aws/signature'
import {downSampleBuffer} from '../utils/audio/down-sample-buffer'
import {pcmEncode} from '../utils/audio/pcm-encode'
import {formatTranscript} from '../utils/format-transcript'

const {AWS_ACCESS_KEY_SECRET, AWS_ACCESS_KEY_ID} = process.env

const EventsEmitter = require('events')
const WebSocket = require('ws')
const marshaller = require('@aws-sdk/eventstream-marshaller')
const util_utf8_node = require('@aws-sdk/util-utf8-node')

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8)

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
  description: string;

  stream: any;

  protected history = '';

  protected buffer: any[] = [];

  protected socket: WebSocket;

  protected inputSampleRate = 44100

  protected outputSampleRate = 8000

  constructor(timeout: number, description = 'AWS Transcribe') {
    super()

    this.description = description

    const signature = new Signature()

    const URL = signature.createWebSocketURL({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.accessKeySecret,
      // languageCode: 'en-GB',
      // sampleRate: this.outputSampleRate,
    })

    this.socket = new WebSocket(URL)

    this.stream = WebSocket.createWebSocketStream(this.socket)

    this.socket.addEventListener(EVENTS.MESSAGE, (message: any) => this.process(message))

    this.socket.addEventListener(EVENTS.ERROR, () => this.close())

    this.socket.addEventListener(EVENTS.OPEN, () => {
      console.log('👂 Connected to AWS Transcribe')
      // console.log(`👂 AWS Transcribe pcmEncoder will use input sample rate of: ${this.inputSampleRate}`)
      // console.log(`👂 AWS Transcribe pcmEncoder will use output sample rate of: ${this.outputSampleRate}`)
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
      console.log('👂 AWS transcribe connection closed.')
      this.emit(EVENTS.DONE)
    }

    process.on('SIGINT', () => {
      if (this.isActive()) this.end()
      else this.showConversation()
      this.emit(EVENTS.DONE)
    })
  }

  getAudioEventMessage(buffer: any) {
    // wrap the audio data in a JSON envelope
    return {
      headers: {
        ':message-type': {
          type: 'string',
          value: 'event',
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent',
        },
      },
      body: buffer,
    }
  }

  convertAudioToBinaryMessage(audioChunk: any) {
    const raw = audioChunk

    if (raw === null) return

    // downSample and convert the raw audio bytes to PCM
    const convertedArray = raw // Float32Array.from(raw)
    const downSampledBuffer = downSampleBuffer(convertedArray)
    const pcmEncodedBuffer = pcmEncode(downSampledBuffer)
    // const intArray = new Uint8Array()
    // const floatArray = Float32Array.from(intArray)

    // add the right JSON headers and structure to the message
    const audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer))

    // convert the JSON object + headers into a binary event stream message
    return eventStreamMarshaller.marshall(audioEventMessage)
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
    const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage)
    return this.socket.send(emptyBuffer)
  }

  close(): void {
    this.socket.close()
  }

  process(data: any) {
    const {fromCharCode} = String
    const messageWrapper = eventStreamMarshaller.unmarshall(Buffer.from(data.data))
    const messageBody = JSON.parse(fromCharCode.apply(String, messageWrapper.body))

    if (messageWrapper.headers[':message-type'].value === 'event') {
      if (messageBody.Transcript.Results?.length) {
        const transcript = messageBody.Transcript.Results[0]?.Alternatives[0]?.Transcript || ''
        this.history += `${formatTranscript(transcript)} `
        console.log('=>', transcript)
      }
    } else {
      console.log('👂 AWS Transcribe encountered an error.', messageBody.Message)
    }
  }

  capture(data: any, rawData: any): void {
    // const b = eventStreamMarshaller.marshall(this.getAudioEventMessage(data))
    const binary = this.convertAudioToBinaryMessage(data)
    console.dir(binary, {maxArrayLength: null})
    // console.dir(binary)
    this.socket.send(binary)
  }
}
