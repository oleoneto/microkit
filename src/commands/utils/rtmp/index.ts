import {Command, flags} from '@oclif/command'
import {NodeMediaServerConfig} from '../../../utils/rtmp'
import {post} from '../../../utils/request'

const NodeMediaServer = require('node-media-server')

const fs = require('fs')

const ffmpeg = require('fluent-ffmpeg')

const URL = require('url')

export default class UtilsRtmpIndex extends Command {
  static description = 'starts an RTMP server (video streaming)'

  static examples = [
    '$ microkit utils:rtmp',
    '$ microkit utils:rtmp --port=1935 --http-port=8090',
    '$ microkit utils:rtmp --record --recording-format=mkv',
  ]

  static flags = {
    // 'auth-play': flags.boolean({description: 'allow playback of RTMP stream [beta]', default: true}),
    // 'auth-publish': flags.boolean({description: 'publish RTMP stream [beta]', default: true}),
    'chunk-size': flags.integer({description: 'RTMP server chunk size', default: 60000}),
    'gop-cache': flags.boolean({description: 'RTMP server cache', default: true}),
    'http-port': flags.integer({description: 'HTTP port', default: 9700}),
    ping: flags.integer({description: 'RTMP server ping', default: 30}),
    'ping-timeout': flags.integer({description: 'RTMP server ping-timeout in seconds', default: 60}),
    port: flags.integer({description: 'RTMP server port', default: 1935}),
    record: flags.boolean({description: 'capture/record RTMP stream into', default: false}),
    'recording-format': flags.enum({description: 'recording format', options: ['mkv'], default: 'mkv'}),
    'source-encoding': flags.enum({description: 'RTMP video source encoding', options: ['flv'], default: 'flv'}),
  }

  async run() {
    const {flags} = this.parse(UtilsRtmpIndex)

    const shouldRecord = flags.record
    const httpPort = flags['http-port']
    const recordingsDirectory = './recordings'
    const recordingFileFormat = flags['recording-format']
    const sourceEncoding = flags['source-encoding']

    // MARK: - Configure and start the RTMP server
    const config: NodeMediaServerConfig = {
      logType: 2,
      rtmp: {
        port: flags.port,
        chunk_size: flags['chunk-size'],
        gop_cache: flags['gop-cache'],
        ping: flags.ping,
        ping_timeout: flags['ping-timeout'],
      },
      http: {
        port: httpPort,
        allow_origin: '*',
        mediaroot: recordingsDirectory,
      },
    }

    const server = new NodeMediaServer(config)

    server.run()

    // MARK: - Handle interrupts
    process.on('SIGINT', () => {
      server.stop()
      process.exit(0)
    })

    // MARK: - Authentication and preconnect check for publishers
    // NOTE: http://[host]/COMBO_INTERACTION + QUEUE_ID/CLIENT_ID/SECRET_KEY
    // NOTE: http://[host]/COMBO_INTERACTION + QUEUE_ID/u1N51PCR1T/9h2Q=r;6UJ}xGs)
    server.on('preConnect', (id: string, args: {app: string; type: string; tcUrl: string}) => {

      const session = server.getSession(id)

      // NOTE: Dummy authentication logic
      try {
        const url = URL.parse(args.tcUrl)
        this.log(url.pathname)

        let urlComponents = url.pathname.split('/')

        urlComponents = urlComponents.filter((e: string) => e !== '')

        if (urlComponents.length !== 3) this.error('Not a valid URL')

        const comboKeyIds = urlComponents[0]
        const clientId = urlComponents[1]
        const secretKey = urlComponents[2]

        this.log(`You are ${comboKeyIds}. Using CLIENT_ID: ${clientId} SECRET_KEY: ${secretKey}`)

        post('http://localhost:3018/v1/auth', '', undefined, {comboKeyIds, clientId, secretKey})
        .then((data: any) => {
          if (!data.accept) session.reject()
        })
        .catch((error: string | Error) => {
          session.reject()
          this.error(error)
        })
      } catch (error) {
        session.reject()
      }
    })

    // MARK: - Authentication and preconnect check for subscriber/clients/players
    server.on('prePlay', (id: string, streamPath: string, args: {ip: string; method: string; streamPath: string; query: any}) => {
      // Pre play authorization
      // let session = nms.getSession(id);
      // session.reject();
      // this.log('NO VIEWING FOR YOU. JK')
      this.log(args.query)
    })

    // MARK: - Set up recording
    if (shouldRecord) {
      server.on('postPublish', (identifier: any, streamPath: string, _: any) => {
        const filepath = `${recordingsDirectory}/${identifier}.${recordingFileFormat}`

        // Ensure recording directory exists
        if (!fs.existsSync(recordingsDirectory)) fs.mkdirSync(recordingsDirectory)

        // NOTE: Since FFMPEG can grap streams over HTTP, we can grab it by using the stream URI.
        // By default, streams are available at http[s]://localhost:[$port]/live/[$streampath].flv
        const source = `http://localhost:${httpPort}${streamPath}.${sourceEncoding}`

        const recordingCommand = ffmpeg(source)
        .inputOptions(['-re'])
        .outputOptions(['-c copy'])
        .on('start', (cmd: string) => this.log('COMMAND: => ', cmd))
        .on('error', (error: any) => this.error(error))
        .output(filepath)

        recordingCommand.run()

        // NOTE: FFMPEG could also be used to pipe the stream to another endpoint, perhaps a socket connection.
        // recordingCommand.pipe(someWritable)

        this.log('Recording source  =>', source)
        this.log('Recording path    =>', filepath)
      })
    }
  }
}
