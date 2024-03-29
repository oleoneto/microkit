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
    mediaroot: string;
  };
  auth?: {
    play?: boolean;
    publish?: boolean;
    secret?: string;
  };
  trans?: {
    tasks?: [
      {
        ffmpeg?: string;
        app: string;
        hls?: boolean;
        hlsFlags?: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]';
        dash?: boolean;
        dashFlags?: '[f=dash:window_size=3:extra_window_size=5]';
        mp4?: boolean;
        mp4Flags?: string;
      }
    ];
  };
}
