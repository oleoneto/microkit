import {Command} from '@oclif/command'
import {cli} from 'cli-ux'

const ffmpeg = require('fluent-ffmpeg')

export default class UtilsAudioInfo extends Command {
  static description = 'check the information of an audio file'

  static flags = {
    ...cli.table.flags(),
  }

  static args = [{name: 'path', required: true}]

  async run() {
    const {args, flags} = this.parse(UtilsAudioInfo)
    const {path} = args

    ffmpeg(path)
    .ffprobe((error: string | undefined, data: { format: any; streams: any }) => {
      if (error) this.log(error)
      const {streams} = data

      const columns: any = {
        bits_per_sample: {header: 'BitsPerSample'},
        bit_rate: {header: 'BitRate'},
        channels: '',
        codec_name: {header: 'Codec'},
        codec_type: {header: 'CodecType'},
        duration: '', // {get: (row: any) => row},
        sample_rate: {header: 'SampleRate'},
      }

      cli.table(streams, columns, {
        printLine: this.log,
        ...flags,
      })
    })
  }
}
