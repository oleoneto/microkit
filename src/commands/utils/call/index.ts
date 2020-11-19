import {Command, flags} from '@oclif/command'
import AriController from '../../../utils/ari'
import RTPServer from '../../../utils/rtp'
import Deepgram from '../../../vendors/deepgram'
import Transcribe from '../../../vendors/transcribe'
import {EVENTS} from '../../../vendors/interfaces/transcriber'

require('dotenv').config()

export default class UtilsCallIndex extends Command {
  static description = 'place a call using an asterisk server'

  static examples = [
    '$ microkit utils:call 6001',
    '$ microkit utils:call 6001 --mode SIP',
    '$ microkit utils:call 6001 --transcribe',
    '$ microkit utils:call 6001 --transcribe -e localhost:5554',
    '$ microkit utils:call 6001 --transcribe --docker --engine=deepgram',
    '$ microkit utils:call 6001 --transcribe -a http://127.0.0.1:8088 -u asterisk --docker',
  ]

  static flags = {
    format: flags.string({char: 'f', description: 'audio format', default: 'ulaw'}),
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
    transcribe: flags.boolean({
      char: 't',
      description: 'transcribe call in real-time',
      default: false,
      dependsOn: ['externalMediaHost'],
    }),
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
    watch: flags.boolean({
      description: 'watch RTP packet information',
      default: false,
      exclusive: ['transcribe'],
    }),
    engine: flags.enum({
      description: 'transcription engine',
      options: ['deepgram', 'transcribe'],
      required: true,
      default: 'deepgram',
    }),
    transcode: flags.boolean({description: 'transcode RTP stream [beta]', default: false}),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  hasCredentials(engine: string): boolean {
    const credentials = [
      {engine: 'deepgram', credentials: Boolean(process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_SECRET)},
      {engine: 'transcribe', credentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET)},
    ]

    return Boolean(credentials.find(e => e.engine === engine)?.credentials)
  }

  async run() {
    // MARK: Parse variables
    const {args, flags} = this.parse(UtilsCallIndex)
    const dialString = `${flags.mode}/${args.dialString}`

    const port = Number(flags.externalMediaHost.split(':').pop())

    const externalMediaHost = flags.docker ? `host.docker.internal:${port}` : flags.externalMediaHost
    const options = {format: flags.format, externalMediaHost}

    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: (flags.transcribe || flags.watch)})

    const server = new RTPServer({
      port,
      shouldLog: true,
      showPackets: false,
      showInfo: flags.watch,
    })

    // MARK: Gracefully terminate ari processes
    server.on(EVENTS.DONE, () => ari.close())

    // MARK: Gracefully terminate server processes
    ari.on(EVENTS.DONE, () => (server && server.isRunning) ? server.close() : 0)

    if (flags.watch && !flags.transcribe) {
      // MARK: Dial as soon as the RTP server is up-and-running
      server.on(EVENTS.READY, async () => ari.dial(dialString, options))
    } else if (flags.transcribe) {
      // MARK: Setup transcriber for external media

      // Ensure transcriber credentials exist
      if (!this.hasCredentials(flags.engine)) this.error('Missing API keys')

      let transcriber: any

      switch (flags.engine) {
      case 'transcribe':
        transcriber = new Transcribe(flags.timeout, flags.transcode)
        break
      default:
        transcriber = new Deepgram(flags.timeout, flags.transcode)
        break
      }

      transcriber.on(EVENTS.DONE, () => (server && server.isRunning) ? server.close() : 0)

      // MARK: Dial after transcriber has connected to websocket
      transcriber.on(EVENTS.READY, async () => {
        await ari.dial(dialString, options)
      })

      // MARK: Capture RTP data in transcriber
      server.on(EVENTS.DATA, (data: any, rawData: any) => transcriber.capture(data, rawData))

      // MARK: Gracefully terminate all processes
      server.on(EVENTS.DONE, () => transcriber.close())
    } else {
      await ari.dial(dialString)
    }
  }
}
