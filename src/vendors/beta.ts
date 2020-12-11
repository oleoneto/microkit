/* eslint-disable no-console */
require('dotenv').config()

import {AwsTranscribe as T, StreamingClient} from 'aws-transcribe'
import Transcriber, {EVENTS} from './interfaces/transcriber'

const EventsEmitter = require('events')

const {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
} = process.env

const getSampleRate = (format: string) => {
  // Provide matching sample rate in the request:
  // so slin16 = (mediaSampleRateHertz = 16000),
  // slin24 = (mediaSampleRateHertz = 24000),
  // slin44 = (mediaSampleRateHertz = 44100)
  switch (format) {
  case 'slin44':
    return 44100
  case 'slin24':
    return 24000
  default:
    return 16000
  }
}

export default class AWSTranscribe extends EventsEmitter implements Transcriber {
  description: string

  stream: StreamingClient;

  buffer: any[] = [];

  constructor(timeout: number, format: string, description = 'AWS Transcribe') {
    super()

    this.description = description

    const Client = new T({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_ACCESS_KEY_SECRET,
    })

    const sampleRate = getSampleRate(format)

    this.stream = Client
    .createStreamingClient({
      region: 'us-east-1',
      languageCode: 'en-US',
      sampleRate,
    })
    .on(EVENTS.OPEN, () => {
      console.log('📝 AWS transcribe connection opened')
      console.log(`📝 AWS transcribe: format/codec => ${format}`)
      console.log(`📝 AWS transcribe: sample rate  => ${sampleRate}`)
      this.emit(EVENTS.READY)
    })
    .on(EVENTS.ERROR, (_error: any) => {
      console.log('📝 AWS transcriber encountered an error')
      this.emit(EVENTS.ERROR)
    })
    .on(EVENTS.CLOSE, () => {
      console.log('📝 AWS Transcribe closed. Buffer size', this.buffer.length)
      this.emit(EVENTS.DONE)
    })
    .on(EVENTS.DATA, (data: any) => {
      this.process(data)
    })
  }

  capture(data: any, rawData: any) {
    this.stream.write(data)
    this.buffer.push({data, rawData})
  }

  process(data: any) {
    const transcript = data.Transcript?.Results[0]?.Alternatives[0]?.Transcript || ''
    console.log('=>', transcript)
  }

  close(): void {
    this.stream.destroy()
  }

  isActive() {
    return Boolean(this.stream)
  }

  end() {
    const emptyMessage = this.getAudioEventMessage(Buffer.from([]))
    return this.stream.write(emptyMessage)
  }
}
