import {Command, flags} from '@oclif/command'
import {EVENTS} from '../../../vendors/interfaces/transcriber'
import RTP from '../../../utils/rtp'
import Deepgram from '../../../vendors/deepgram'
import Transcribe from '../../../vendors/transcribe'

export default class TranscribeIndex extends Command {
  static description = 'transcribe an audio stream'

  static examples = [
    '$ microkit utils:transcribe',
    '$ microkit utils:transcribe --port 5554',
    '$ microkit utils:transcribe --engine=deepgram',
    '$ microkit utils:transcribe --engine=deepgram --port 5554',
  ]

  static flags = {
    host: flags.string({description: 'RTP server host', default: '127.0.0.1'}),
    port: flags.integer({char: 'p', description: 'RTP client port', default: 5554}),
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
    engine: flags.enum({
      description: 'transcription engine',
      options: ['deepgram', 'transcribe'],
      required: true,
      default: 'deepgram',
    }),
  }

  static transcriber: any

  async run() {
    const {flags} = this.parse(TranscribeIndex)

    // MARK: Ensure API credentials exist
    const credentials = Boolean(process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_SECRET)
    if (!credentials) {
      this.error('Ensure both DEEPGRAM_API_KEY and DEEPGRAM_API_SECRET are defined in your environment variables')
    }

    switch (flags.engine) {
    case 'transcribe':
      TranscribeIndex.transcriber = new Transcribe(flags.timeout)
      break
    default:
      TranscribeIndex.transcriber = new Deepgram(flags.timeout)
      break
    }

    // MARK: Setup transcriber client and RTP server
    TranscribeIndex.transcriber.on(EVENTS.READY, () => {
      const server = new RTP({
        port: flags.port,
        shouldLog: true,
      })

      // MARK: Capture RTP data in transcriber
      server.on(EVENTS.DATA, (data: any, rawData: any) => {
        TranscribeIndex.transcriber.capture(data, rawData)
      })

      // MARK: Gracefully terminate all processes
      server.on(EVENTS.DONE, () => {
        TranscribeIndex.transcriber.close()
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
      })
    })
  }
}
