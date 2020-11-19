import {Command, flags} from '@oclif/command'
import RTMPServer, {NodeMediaServerConfig} from '../../../utils/rtmp'

export default class UtilsRtmpIndex extends Command {
  static description = 'starts an RTMP server (video streaming)'

  static flags = {
    'mount-point': flags.string({description: 'RTMP server default mount point', default: 'live'}),
    chunkSize: flags.integer({description: 'RTMP server chunk size', default: 60000}),
    'gop-cache': flags.boolean({description: 'RTMP server cache', default: true}),
    'http-port': flags.integer({description: 'HTTP port', default: 9700}),
    ping: flags.integer({description: 'RTMP server ping', default: 30}),
    'ping-timeout': flags.integer({description: 'RTMP server ping-timeout in seconds', default: 60}),
    port: flags.integer({description: 'RTMP server port', default: 1935}),
    transcode: flags.boolean({description: 'transcode RTMP stream [beta]', default: false}),
    'auth-play': flags.boolean({description: 'allow playback of RTMP stream [beta]', default: true}),
    'auth-publish': flags.boolean({description: 'publish RTMP stream [beta]', default: true}),
  }

  async run() {
    const {flags} = this.parse(UtilsRtmpIndex)

    const config: NodeMediaServerConfig = {
      logType: 2,
      rtmp: {
        port: flags.port,
        chunk_size: flags.chunkSize,
        gop_cache: flags['gop-cache'],
        ping: flags.ping,
        ping_timeout: flags['ping-timeout'],
      },
      http: {
        port: flags['http-port'],
        allow_origin: '*',
      },
    }

    return new RTMPServer(config)
  }
}
