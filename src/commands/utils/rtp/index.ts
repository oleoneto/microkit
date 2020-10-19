import {Command, flags} from '@oclif/command'
import Server from '../../../utils/rtp'

export default class RTPIndex extends Command {
  static description = 'starts an RTP server'

  static examples = [
    '$ microkit utils:rtp',
    '$ microkit utils:rtp --host localhost --port 5554',
    '$ microkit utils:rtp --host localhost',
    '$ microkit utils:rtp --port 5554',
  ]

  static flags = {
    host: flags.string({description: 'RTP server host', default: '127.0.0.1'}),
    port: flags.integer({description: 'RTP client port', default: 5554}),
    log: flags.boolean({description: 'log RTP server messages', default: false}),
  }

  async run() {
    const {flags} = this.parse(RTPIndex)

    return new Server({
      host: flags.host,
      port: flags.port,
      shouldLog: flags.log,
    })
  }
}
