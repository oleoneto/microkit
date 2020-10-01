import AWS from './aws'

const fs = require('fs')
const path = require('path')

const s3 = new AWS().s3()

export default (filename: string, bucket: string, location?: string) => {
  return new Promise((resolve, reject) => {
    const dir = location || '/tmp'

    if (dir.endsWith('/')) dir.replace(/\/$/, '')

    const filepath = `${dir}/${path.basename(filename)}`
    const params = {Bucket: bucket, Key: filename}
    const stream = s3.getObject(params).createReadStream()
    const fileStream = fs.createWriteStream(filepath)

    stream.on('error', (error: { message: string | Buffer }) => reject(error))

    fileStream.on('error', (error: { message: string | Buffer }) => reject(error))

    fileStream.on('close', () => resolve(filepath))

    stream.pipe(fileStream)
  })
}
