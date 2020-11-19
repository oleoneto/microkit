export interface NodeMediaServerConfig {
  logType?: number;
  rtmp: {
    port: number;
    chunk_size: number;
    gop_cache: boolean;
    ping: number;
    ping_timeout: number;
  };
  http: {
    port: number;
    allow_origin: string;
  };
  auth?: {
    play?: boolean;
    publish?: boolean;
    secret?: string;
  };
  tasks?: [
    {
      app: string;
      hls?: boolean;
      hlsFlags?: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]';
      dash?: boolean;
      dashFlags?: '[f=dash:window_size=3:extra_window_size=5]';
    }
  ];
}

const NodeMediaServer = require('node-media-server')

const EventsEmitter = require('events')

export default class RTMPServer extends EventsEmitter {
  protected server: any

  constructor(config: NodeMediaServerConfig) {
    super()
    this.server = new NodeMediaServer(config)
    this.server.run()

    process.on('SIGINT', () => {
      this.server.stop()
      process.exit(0)
    })
  }
}
