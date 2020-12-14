import {Command} from '@oclif/command'
import Deepgram from '../../../vendors/deepgram'
import {EVENTS} from '../../../vendors/interfaces/transcriber'
import {PassThrough} from 'stream'
import AWSTranscribe from '../../../vendors/transcribe'
import {cli} from 'cli-ux'
// import AriController from '../../../utils/ari'
// import RTPServer from '../../../utils/rtp'

// const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')

require('dotenv').config()

export default class UtilsBeta extends Command {
  static description = 'transcribe with ffmpeg'

  async run() {
    // Start RTP stream => ffmpeg -re -f lavfi -i aevalsrc="sin(400*2*PI*t)" -ar 8000 -f mulaw -f rtp rtp://127.0.0.1:1234
    // Play RTP stream  => ffplay rtp://127.0.0.1:1234
    // https://github.com/wechaty/wechaty-getting-started/blob/master/examples/professional/speech-to-text-bot.ts#L102

    const transcriber = new AWSTranscribe(300, 'slin44', 'AWS Transcribe')
    const sourceLink = 'http://localhost:8092/stream'

    transcriber.on(EVENTS.READY, async () => {
      const ffstream = ffmpeg(sourceLink)
      // .inputOptions(['-re'])
      .outputOptions(['-ac 1'])
      .toFormat('wav')
      .on('start', (cmd: any) => this.log('=> Command:', cmd))
      .on('error', (error: { message: any }) => this.log('=> An error occurred:', error.message))
      .on('end', () => this.log('=> Processing finished!'))
      .on('data', (chunk: string | any[]) => {
        this.log(`=> ffmpeg wrote ${chunk.length} bytes`)
      })

      ffstream
      .ffprobe((error: string | undefined, data: { format: any; streams: any }) => {
        if (error) this.log(error)
        const {streams} = data

        const columns: any = {
          bits_per_sample: {header: 'BitsPerSample'},
          bit_rate: {header: 'BitRate'},
          channels: '',
          codec_name: {header: 'Codec'},
          codec_type: {header: 'CodecType'},
          duration: {header: 'DurationInSeconds'},
          sample_rate: {header: 'SampleRate'},
        }

        cli.table(streams, columns, {
          printLine: this.log,
          // ...flags,
        })
      })

      ffstream.pipe(transcriber.duplex)
    })

    // eslint-disable-next-line unicorn/no-process-exit
    transcriber.on(EVENTS.DONE, () => process.exit(0))
  }
}
