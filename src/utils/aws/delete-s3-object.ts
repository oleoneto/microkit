import AWS from './aws'

const s3 = new AWS().s3()

export default (bucket: string, filename: string) => new Promise((resolve, reject) => {
  s3.deleteObject({
    Bucket: bucket,
    Key: filename,
  }, (error: any, data: unknown) => {
    return error ? reject(error) : resolve(data)
  })
})

