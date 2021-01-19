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
    '$ microkit utils:call 6001 -e http://127.0.0.1:1234 --docker',
    '$ microkit utils:call 6001 -e http://127.0.0.1:1234 --docker --format=ulaw',
  ]

  static flags = {
    format: flags.string({
      char: 'f',
      description: 'audio format',
      default: 'ulaw',
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
    'enable-external-media': flags.boolean({description: 'enable external media [asterisk 16+]', default: false}),
    'external-media-host': flags.string({
      char: 'e',
      description: 'RTP listening server address (external host)',
      dependsOn: ['enable-external-media'],
    }),
    docker: flags.boolean({
      description: 'set this if asterisk server is running inside a docker container',
    }),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  async run() {
    // MARK: Parse variables
    const {args, flags} = this.parse(UtilsCallIndex)
    const dialString = `${flags.mode}/${args.dialString}`

    const port = flags['external-media-host'] ? Number(flags['external-media-host'].split(':').pop()) : 1234

    const externalMediaHost = flags.docker ? `host.docker.internal:${port}` : flags['external-media-host'] as string
    const options = {format: flags.format, externalMediaHost}

    // MARK: Setup ARI and dial
    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: flags['enable-external-media']})

    // MARK: Gracefully terminate server processes
    ari.on(EVENTS.DONE, () => this.log('Ari client closed.'))

    // MARK: Place phone call
    await ari.dial(dialString, options)
  }
}
