import AWS from './aws'

const s3 = new AWS().s3()

export default (bucket: string, filename: string) => new Promise((resolve, reject) => {
  s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: filename,
  }, (error: any, data) => {
    if (error) return reject(error)
    return resolve(data)
  })
})
