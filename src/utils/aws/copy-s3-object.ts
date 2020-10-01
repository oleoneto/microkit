import AWS from './aws'

const s3 = new AWS().s3()

export default (bucket: string, input: string, output: string) => new Promise((resolve, reject) => {
  const source = `${bucket}/${input}`

  s3.copyObject({
    CopySource: source,
    Bucket: bucket,
    Key: output,
  }, (error: any, data: unknown) => {
    return error ? reject(error) : resolve(data)
  })
})
