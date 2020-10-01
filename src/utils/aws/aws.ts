import * as aws from 'aws-sdk'
require('dotenv').config()

export default class AWS {
  s3(config: { region?: string } = {}): aws.S3 {
    return new aws.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      region: config.region || 'us-east-1',
    })
  }

  static async getS3AsBuffer(S3: aws.S3, bucket: string, key: string): Promise<aws.S3.Body> {
    return (await S3.getObject({
      Bucket: bucket,
      Key: key,
    }).promise()).Body!
  }
}
