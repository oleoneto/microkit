import {Command, flags} from '@oclif/command'
import Server from '../../../utils/rtp'

export default class RTPIndex extends Command {
  static description = 'starts an RTP server'

  static examples = [
    '$ microkit utils:rtp',
    '$ microkit utils:rtp --port 5554',
    '$ microkit utils:rtp --show-packets=true',
  ]

  static flags = {
    engine: flags.enum({char: 'e', description: 'transcriber engine', options: ['aws', 'deepgram'], dependsOn: ['transcribe']}),
    log: flags.boolean({description: 'log RTP server messages', default: false}),
    port: flags.integer({char: 'p', description: 'RTP client port', default: 5554}),
    'show-info': flags.boolean({description: 'show RTP packet info', default: false}),
    'show-packets': flags.boolean({description: 'show RTP packets', default: false}),
    transcribe: flags.boolean({char: 't', description: 'enables audio transcription of RTP traffic', default: false}),
  }

  async run() {
    const {flags} = this.parse(RTPIndex)

    return new Server({
      port: flags.port,
      shouldLog: flags.log,
      showPackets: flags['show-packets'],
      showInfo: flags['show-info'],
      supportsTranscriptions: flags.transcribe,
      transcriberEngine: flags.engine,
    })
  }
}
