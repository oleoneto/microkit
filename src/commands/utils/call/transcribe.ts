import {Command, flags} from '@oclif/command'
import Transcribe from '../../../vendors/transcribe'
import Deepgram from '../../../vendors/deepgram'
import {EVENTS} from '../../../vendors/interfaces/transcriber'

const ffmpeg = require('fluent-ffmpeg')

require('dotenv').config()

export default class UtilsBeta extends Command {
  static description = 'real-time transcribing [transcoding with ffmpeg]'

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

    let transcriber: any

    switch (flags.engine) {
    case 'transcribe':
      transcriber = new Transcribe(flags.timeout, 'slin44', 'aws-transcribe')
      break
    default:
      transcriber = new Deepgram(flags.timeout, 'slin44', 'deepgram')
      break
    }

    transcriber.on(EVENTS.READY, async () => {
      const ffstream = ffmpeg(args.source)
      .inputOptions(['-protocol_whitelist', 'pipe,udp,rtp'])
      .outputOptions(['-ac 1', '-preset', 'veryfast', '-ar 44100'])
      .toFormat('wav')
      .on('start', (cmd: any) => this.log('=> Command:', cmd))
      .on('error', (error: { message: any }) => this.log('=> An error occurred:', error.message))
      .on('end', () => this.log('=> Processing finished!'))
      .on('data', (chunk: string | any[]) => {
        this.log(`=> ffmpeg wrote ${chunk.length} bytes`)
      })

      ffstream.pipe(transcriber.duplex)
    })

    // eslint-disable-next-line unicorn/no-process-exit
    transcriber.on(EVENTS.DONE, () => process.exit(0))
  }
}
