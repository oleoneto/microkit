import {Command, flags} from '@oclif/command'
import RTP from '../../../utils/rtp'
import Deepgram from '../../../vendors/deepgram'

export default class TranscribeIndex extends Command {
  static description = 'transcribe an audio stream'

  static examples = [
    '$ microkit utils:transcribe',
    '$ microkit utils:transcribe --host localhost --port 5554',
    '$ microkit utils:transcribe --host localhost',
    '$ microkit utils:transcribe --port 5554',
  ]

  static flags = {
    host: flags.string({description: 'RTP server host', default: '127.0.0.1'}),
    port: flags.integer({char: 'p', description: 'RTP client port', default: 5554}),
    vendor: flags.enum({char: 'v', description: 'transcription vendor', options: ['deepgram'], default: 'deepgram'}),
  }

  static transcriber: Deepgram

  async run() {
    const {flags} = this.parse(TranscribeIndex)

    // MARK: Ensure API credentials exist

    const credentials = Boolean(process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_SECRET)
    if (!credentials) {
      this.error('Ensure both DEEPGRAM_API_KEY and DEEPGRAM_API_SECRET are defined in your environment variables')
    }

    // MARK: Setup transcriber client and RTP server
    TranscribeIndex.transcriber = new Deepgram()

    TranscribeIndex.transcriber.on('ready', () => {
      return new RTP({
        host: flags.host,
        port: flags.port,
        shouldLog: true,
      }, TranscribeIndex.transcriber.stream)
    })
  }
}
