import {Command, flags} from '@oclif/command'
import AriController from '../../../utils/ari'
import RTPServer from '../../../utils/rtp'
import Deepgram from '../../../vendors/deepgram'
import Transcribe from '../../../vendors/transcribe'
import {EVENTS} from '../../../vendors/interfaces/transcriber'

const ffmpeg = require('fluent-ffmpeg')

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
    format: flags.enum({
      char: 'f',
      description: 'audio format',
      options: [
        'amr-nb', // <== only supported by deepgram
        'amr-wb', // <== only supported by deepgram
        'flac',   // <== only supported by deepgram
        'opus',   // <== only supported by deepgram
        'slin',
        'slin16',
        'slin24',
        'slin32',
        'slin44',
        'slin48',
        'slin96',
        'slin192',
        'speex', // <== only supported by deepgram
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
    transcribe: flags.boolean({
      char: 't',
      description: 'transcribe call in real-time',
      dependsOn: ['externalMediaHost'],
    }),
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
    watch: flags.boolean({
      description: 'watch RTP packet information',
      default: false,
    }),
    engine: flags.enum({
      description: 'transcription engine',
      options: ['deepgram', 'transcribe', 'beta'],
      required: true,
      default: 'deepgram',
    }),
    transcode: flags.boolean({description: 'transcode RTP stream with ffmpeg (always true when engine=transcribe)', dependsOn: ['transcribe'], default: false}),
    'show-rtp-packets': flags.boolean({description: 'show RTP packets', default: false}),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  hasCredentials(engine: string): boolean {
    const credentials = [
      {engine: 'deepgram', credentials: Boolean(process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_SECRET)},
      {engine: 'transcribe', credentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET)},
      {engine: 'beta', credentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET)},
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
    // const transcode = flags.engine === 'transcribe' ? true : flags.transcode

    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: (flags.transcribe || flags.watch)})

    const server = new RTPServer({
      port,
      shouldLog: flags.watch,
      showPackets: flags['show-rtp-packets'],
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
        transcriber = new Transcribe(flags.timeout, 'slin44', 'aws-transcribe')
        break
      default:
        transcriber = new Deepgram(flags.timeout, 'slin44', 'deepgram')
        break
      }

      transcriber.on(EVENTS.DONE, () => {
        (server && server.isRunning) ? server.close() : 0
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0)
      })

      // MARK: Dial after transcriber has connected to websocket
      transcriber.on(EVENTS.READY, async () => {
        this.log('=> Using ffmpeg for transcoding [beta]')

        const ffstream = ffmpeg(`rtp://localhost:${port}`)
        .inputOptions(['-protocol_whitelist', 'pipe,udp,rtp'])
        .outputOptions(['-ac 1', '-preset', 'veryfast', '-ar 44100'])
        .toFormat('wav')
        .on(EVENTS.START, (cmd: any) => this.log('=> Command:', cmd))
        .on(EVENTS.ERROR, (error: { message: any }) => this.log('=> An error occurred:', error.message))
        .on(EVENTS.END, () => this.log('=> Processing finished!'))
        .on(EVENTS.DATA, (chunk: string | any[]) => {
          this.log(`=> ffmpeg wrote ${chunk.length} bytes`)
        })

        ffstream.pipe(transcriber.duplex)

        // server.on(EVENTS.LISTENING, () => {
        //   // server.listener = transcriber.duplex
        //   server.pipe(transcriber.duplex)
        //   this.log('=> Piping stream directly to PassThrough()')
        // })

        await ari.dial(dialString, options)
      })

      // MARK: Gracefully terminate all processes
      server.on(EVENTS.DONE, () => transcriber.close())
    } else {
      await ari.dial(dialString)
    }
  }
}
