import {Command, flags} from '@oclif/command'
import AriController from '../../../utils/ari'
import {EVENTS} from '../../../vendors/interfaces/transcriber'

require('dotenv').config()

export default class UtilsCallIndex extends Command {
  static description = 'place a call using an asterisk server'

  static examples = [
    '$ microkit utils:call 6001',
    '$ microkit utils:call 6001 --mode SIP',
    '$ microkit utils:call 6001 -e localhost:5554',
    '$ microkit utils:call 6001 --docker --engine=deepgram',
    '$ microkit utils:call 6001 -a http://127.0.0.1:8088 -u asterisk --docker',
  ]

  static flags = {
    format: flags.enum({
      char: 'f',
      description: 'audio format',
      options: [
        'slin',
        'slin16',
        'slin24',
        'slin32',
        'slin192',
        'ulaw',  // <== only supported by deepgram
      ],
      default: 'slin',
    }),
    mode: flags.string({char: 'm', description: 'mode', default: 'SIP'}),
    address: flags.string({
      char: 'a',
      description: 'asterisk server address',
      default: 'http://127.0.0.1:8088',
      required: true,
    }),
    username: flags.string({
      char: 'u',
      description: 'asterisk user',
      default: 'asterisk',
      env: 'ASTERISK_USERNAME',
      required: true,
    }),
    password: flags.string({
      char: 'p',
      description: 'asterisk password',
      default: 'asterisk',
      env: 'ASTERISK_PASSWORD',
      required: true,
    }),
    externalMediaHost: flags.string({
      char: 'e',
      description: 'RTP listening server address (external host)',
      default: 'localhost:5554',
    }),
    docker: flags.boolean({
      description: 'set this if asterisk server is running inside a docker container',
    }),
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
    engine: flags.enum({
      description: 'transcription engine',
      options: ['deepgram', 'transcribe'],
      required: true,
      default: 'deepgram',
    }),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  async run() {
    // MARK: Parse variables
    const {args, flags} = this.parse(UtilsCallIndex)
    const dialString = `${flags.mode}/${args.dialString}`

    const port = Number(flags.externalMediaHost.split(':').pop())

    const externalMediaHost = flags.docker ? `host.docker.internal:${port}` : flags.externalMediaHost
    const options = {format: flags.format, externalMediaHost}

    // MARK: Setup ARI and dial
    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: true})

    // MARK: Gracefully terminate server processes
    ari.on(EVENTS.DONE, () => this.log('Ari client closed.'))

    // MARK: Place phone call
    await ari.dial(dialString, options)
  }
}
