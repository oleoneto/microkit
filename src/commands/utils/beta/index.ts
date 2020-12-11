import {StartStreamTranscriptionCommand, StartStreamTranscriptionCommandOutput, TranscribeStreamingClient} from '@aws-sdk/client-transcribe-streaming'
import {Command, flags} from '@oclif/command'
import AriController from '../../../utils/ari'
import RTPServer from '../../../utils/rtp'
import {EVENTS} from '../../../vendors/interfaces/transcriber'
const {PassThrough} = require('stream')

require('dotenv').config()

const handleResponse = async (response: StartStreamTranscriptionCommandOutput) => {
  // This snippet should be put into an async function
  for await (const event of response.TranscriptResultStream) {
    if (event.TranscriptEvent) {
      const message = event.TranscriptEvent
      // Get multiple possible results
      const results = event.TranscriptEvent.Transcript.Results
      // Print all the possible transcripts
      results.map((result: { Alternatives: any }) => {
        (result.Alternatives || []).map((alternative: { Items: any[] }) => {
          const transcript = alternative.Items.map((item: { Content: any }) => item.Content).join(' ')
          // eslint-disable-next-line no-console
          console.log(transcript)
        })
      })
    }
  }
}

export default class UtilsBeta extends Command {
  static description = 'place a call using an asterisk server'

  static examples = [
    '$ microkit utils:beta 6001',
    '$ microkit utils:beta 6001 --mode SIP',
    '$ microkit utils:beta 6001 -e localhost:5554',
    '$ microkit utils:beta 6001 --docker',
    '$ microkit utils:beta 6001 -a http://127.0.0.1:8088 -u asterisk --docker',
  ]

  static flags = {
    codec: flags.enum({
      char: 'f',
      description: 'audio codec or encoding format',
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
    timeout: flags.integer({description: 'set limit for transcriber connection in seconds', default: 180}),
    watch: flags.boolean({
      description: 'watch RTP packet information',
      default: false,
      exclusive: ['transcribe'],
    }),
    pipe: flags.boolean({description: 'pipe RTP stream to transcriber'}),
    'show-rtp-logs': flags.boolean({description: 'show RTP logs', default: true}),
  }

  static args = [{name: 'dialString', required: true, example: '6001'}]

  hasCredentials(): boolean {
    return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET)
  }

  async run() {
    // MARK: Parse variables
    const {args, flags} = this.parse(UtilsBeta)
    const dialString = `${flags.mode}/${args.dialString}`

    const port = Number(flags.externalMediaHost.split(':').pop())

    const externalMediaHost = flags.docker ? `host.docker.internal:${port}` : flags.externalMediaHost
    const options = {format: flags.codec, externalMediaHost}

    const ari = new AriController({
      address: flags.address,
      username: flags.username,
      password: flags.password,
    }, 'microkit-asterisk', {enableExternalMedia: true})

    const server = new RTPServer({
      port,
      shouldLog: flags['show-rtp-logs'],
      showPackets: flags.watch,
      showInfo: flags.watch,
    })

    // Ensure transcriber credentials exist
    if (!this.hasCredentials()) this.error('Missing API keys')

    const client = new TranscribeStreamingClient({
      region: 'us-east-1',
    })

    // MARK: Gracefully terminate all processes
    ari.on(EVENTS.DONE, () => (server && server.isRunning) ? server.close() : 0)
    server.on(EVENTS.DONE, () => {
      client.destroy()
      ari.close()
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0)
    })

    const audioPayloadStream = new PassThrough({highWaterMark: 1 * 1024})

    server.pipe(audioPayloadStream, true)

    await ari.dial(dialString, options)

    const audioStream = async function * () {
      for await (const payload of audioPayloadStream) {
        yield {AudioEvent: {AudioChunk: payload}}
      }
    }

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: 'en-US',
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 44100,
      AudioStream: audioStream(),
    })

    try {
      const response = await client.send(command)
      await handleResponse(response)
    } catch (error) {
      if (error.name === 'InternalFailureException') {
        /* handle InternalFailureException */
        this.error(error.name)
      } else if (error.name === 'ConflictException') {
        /* handle ConflictException */
        this.error(error.name)
      } else {
        this.log(error.name)
      }
    }
  }
}
