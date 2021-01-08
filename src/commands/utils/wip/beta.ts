import {Command, flags} from '@oclif/command'
import Transcribe from '../../../vendors/transcribe'
import Deepgram from '../../../vendors/deepgram'
import {EVENTS} from '../../../vendors/interfaces/transcriber'
import {cli} from 'cli-ux'
import RTPIndex from '../rtp'
import RTPServer from "../../../utils/rtp";

const ffmpeg = require('fluent-ffmpeg')

require('dotenv').config()

export default class UtilsBeta extends Command {
  static description = 'transcribe with ffmpeg'

  static flags = {
    engine: flags.enum({
      description: 'transcription engine', options: ['deepgram', 'transcribe'], required: true, default: 'deepgram',
    }),
    probe: flags.boolean({description: 'get information from input stream', default: false}),
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
  }

  static args = [{name: 'source', required: true}]

  async run() {
    const {args, flags} = this.parse(UtilsBeta)

    // Start RTP stream => ffmpeg -re -f lavfi -i aevalsrc="sin(400*2*PI*t)" -ar 8000 -f mulaw -f rtp rtp://127.0.0.1:1234
    // Play RTP stream  => ffplay rtp://127.0.0.1:1234
    // https://github.com/wechaty/wechaty-getting-started/blob/master/examples/professional/speech-to-text-bot.ts#L102

    let transcriber: any

    switch (flags.engine) {
    case 'transcribe':
      transcriber = new Transcribe(flags.timeout, 'slin44', 'aws-transcribe')
      break
    default:
      transcriber = new Deepgram(flags.timeout, 'slin44', 'deepgram')
      break
    }

    const port = 4444
    const source = 'http://localhost:8092/stream'

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const server = new RTPServer({
    //   port,
    //   shouldLog: true,
    //   showInfo: true,
    // })

    transcriber.on(EVENTS.READY, async () => {
      const ffstream = ffmpeg(source)
      // .inputOptions(['-protocol_whitelist', 'pipe,udp,rtp'])
      .outputOptions(['-ac 1', '-preset', 'veryfast', '-ar 44100'])
      .toFormat('wav')
      .on('start', (cmd: any) => this.log('=> Command:', cmd))
      .on('error', (error: { message: any }) => this.log('=> An error occurred:', error.message))
      .on('end', () => this.log('=> Processing finished!'))
      .on('data', (chunk: string | any[]) => {
        this.log(`=> ffmpeg wrote ${chunk.length} bytes`)
      })

      // => Using probe to obtain information about the stream
      if (flags.probe) {
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
          })
        })
      }

      ffstream.pipe(transcriber.duplex)
    })

    // eslint-disable-next-line unicorn/no-process-exit
    transcriber.on(EVENTS.DONE, () => process.exit(0))
  }
}
