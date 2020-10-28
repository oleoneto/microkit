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
    port: flags.integer({description: 'RTP client port', default: 5554}),
    log: flags.boolean({description: 'log RTP server messages', default: false}),
    'show-packets': flags.boolean({description: 'show RTP packets', default: false}),
    'show-info': flags.boolean({description: 'show RTP packet info', default: false}),
  }

  async run() {
    const {flags} = this.parse(RTPIndex)

    return new Server({
      port: flags.port,
      shouldLog: flags.log,
      showPackets: flags['show-packets'],
      showInfo: flags['show-info'],
    })
  }
}
