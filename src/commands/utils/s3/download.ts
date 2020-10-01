import {Command, flags} from '@oclif/command'
import downloadS3Object from '../../../utils/aws/download-s3-object'
import {cli} from 'cli-ux'

export default class UtilsS3Download extends Command {
  static description = 'download file from S3 bucket'

  static examples = [
    '$ s3:download audio.mp3 --bucket my-photos',
    '$ s3:download audio.mp3 --bucket my-photos -l ~/Downloads',
  ]

  static flags = {
    bucket: flags.string({char: 'b', description: 'name of S3 bucket', required: true, env: 'AWS_S3_BUCKET'}),
    downloadLocation: flags.string({char: 'l', description: 'path where the downloads should be saved', required: false}),
  }

  static args = [{name: 'key', required: true}]

  async run() {
    const {args, flags} = this.parse(UtilsS3Download)

    // MARK: Ensure credentials are present
    if (!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET)) {
      this.error('Missing values for AWS_ACCESS_KEY_ID and AWS_ACCESS_KEY_SECRET in your environment')
    }

    cli.action.start('Downloading')
    await downloadS3Object(args.key, flags.bucket, flags.downloadLocation)
    cli.action.stop()
  }
}
