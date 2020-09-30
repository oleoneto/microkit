import {Command, flags} from '@oclif/command'
import AriController from '../../../utils/ari'
import RTPServer from '../../../utils/rtp'
import Deepgram from '../../../vendors/deepgram'

require('dotenv').config()

export default class UtilsCallIndex extends Command {
  static description = 'place a call using an asterisk server'

  static examples = [
    '$ call 6001',
    '$ call 6001 --mode SIP',
    '$ call 6001 --transcribe',
    '$ call 6001 --transcribe -e localhost:5554',
    '$ call 6001 --transcribe -a http://127.0.0.1:8088 -u asterisk --docker',
  ]

  static flags = {
    format: flags.string({char: 'f', description: 'audio format', default: 'ulaw'}),
    mode: flags.string({char: 'm', description: 'mode', default: 'SIP'}),
    address: flags.string({
      char: 'a',
      description: 'asterisk server address',
      default: 'http://127.0.0.1:8088',
    }),
    username: flags.string({
      char: 'u',
      description: 'asterisk user',
      default: 'asterisk',
      env: 'ASTERISK_USERNAME',
    }),
    password: flags.string({
      char: 'p',
      description: 'asterisk password',
      default: 'asterisk',
      env: 'ASTERISK_PASSWORD',
    }),
    externalMediaHost: flags.string({
      char: 'e',
      description: 'RTP listening server address (external host)',
      default: 'localhost:5554',
    }),
    docker: flags.boolean({
      description: 'indicate whether asterisk server is running within a docker container',
      dependsOn: ['transcribe'],
    }),
    transcribe: flags.boolean({
      char: 't',
      description: 'transcribe call in real-time',
      default: false,
      dependsOn: ['externalMediaHost'],
    }),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  async run() {
    // MARK: Parse variables
    const {args, flags} = this.parse(UtilsCallIndex)
    const dialString = `${flags.mode}/${args.dialString}`

    this.log(JSON.stringify({docker: flags.docker, u: flags.username}))

    const host = flags.externalMediaHost.split(':').shift()
    const port = Number(flags.externalMediaHost.split(':').pop())

    const externalMediaHost = flags.docker ? `host.docker.internal:${port}` : flags.externalMediaHost
    const options = {format: flags.format, externalMediaHost}
    const shouldTranscribe = flags.transcribe

    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: flags.transcribe})

    // MARK: Setup transcriber for external media
    if (shouldTranscribe) {
      const transcriber = new Deepgram()

      // MARK: Setup RTP server with transcriber.stream as audio destination
      const server = new RTPServer({host, port, shouldLog: true}, transcriber.stream)

      // MARK: Dial as soon as the RTP server is up-and-running
      server.on('ready', async () => ari.dial(dialString, options))

      // MARK: Gracefully terminate related processes
      ari.on('close', () => {
        transcriber.close()
        if (server.isRunning) server.close()
      })
    } else {
      await ari.dial(dialString)
    }
  }
}
