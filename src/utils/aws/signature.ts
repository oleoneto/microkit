/* eslint-disable max-params */
const crypto = require('crypto')
const querystring = require('query-string')

export class Signature {
  createCanonicalRequest(method: string, pathname: string, query: { [x: string]: string | number | boolean }, headers: { [x: string]: { toString: () => string } }, payload: string) {
    return [
      method.toUpperCase(),
      pathname,
      this.createCanonicalQueryString(query),
      this.createCanonicalHeaders(headers),
      this.createSignedHeaders(headers),
      payload,
    ].join('\n')
  }

  createCanonicalQueryString(params: { [x: string]: string | number | boolean }) {
    return Object.keys(params).sort().map(key => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    }).join('&')
  }

  createCanonicalHeaders(headers: { [x: string]: { toString: () => string } }) {
    return Object.keys(headers).sort().map(name => {
      return name.toLowerCase().trim() + ':' + headers[name].toString().trim() + '\n'
    }).join('')
  }

  createSignedHeaders(headers: {}) {
    return Object.keys(headers).sort().map(name => {
      return name.toLowerCase().trim()
    }).join(';')
  }

  createCredentialScope(time: string | number | Date, region: any, service: string) {
    return [this.toDate(time), region, service, 'aws4_request'].join('/')
  }

  createStringToSign(time: string | number | Date, region: any, service: string, request: string) {
    return [
      'AWS4-HMAC-SHA256',
      this.toTime(time),
      this.createCredentialScope(time, region, service),
      this.hash(request, 'hex'),
    ].join('\n')
  }

  createSignature(secret: string, time: any, region: string, service: string, stringToSign: string) {
    const h1 = this.hmac('AWS4' + secret, this.toDate(time)) // date-key
    const h2 = this.hmac(h1, region) // region-key
    const h3 = this.hmac(h2, service) // service-key
    const h4 = this.hmac(h3, 'aws4_request') // signing-key
    return this.hmac(h4, stringToSign, 'hex')
  }

  createPreSignedS3URL(name: string, options: { method?: any; bucket?: any; key?: any; secret?: any; protocol?: any; headers?: any; timestamp?: any; region?: any; expires?: any; query?: any; sessionToken?: any }) {
    options = options || {}
    options.method = options.method || 'GET'
    options.bucket = options.bucket || process.env.AWS_S3_BUCKET
    return this.createPreSignedURL(
      options.method,
      options.bucket + '.s3.amazonaws.com',
      '/' + name,
      's3',
      'UNSIGNED-PAYLOAD',
      options
    )
  }

  createPreSignedURL(method: any, host: string, path: string, service: string, payload: string, options: { key?: any; secret?: any; protocol?: any; headers?: any; timestamp?: any; region?: any; expires?: any; query?: any; sessionToken?: any }) {
    options = options || {}
    options.key = options.key || process.env.AWS_ACCESS_KEY_ID
    options.secret = options.secret || process.env.AWS_SECRET_ACCESS_KEY
    options.protocol = options.protocol || 'https'
    options.headers = options.headers || {}
    options.timestamp = options.timestamp || Date.now()
    options.region = options.region || process.env.AWS_REGION || 'us-east-1'
    options.expires = options.expires || 86400 // 24 hours
    options.headers = options.headers || {}

    // host is required
    options.headers.Host = host

    const query = options.query ? querystring.parse(options.query) : {}
    query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256'
    query['X-Amz-Credential'] = options.key + '/' + this.createCredentialScope(options.timestamp, options.region, service)
    query['X-Amz-Date'] = this.toTime(options.timestamp)
    query['X-Amz-Expires'] = options.expires
    query['X-Amz-SignedHeaders'] = this.createSignedHeaders(options.headers)
    if (options.sessionToken) {
      query['X-Amz-Security-Token'] = options.sessionToken
    }

    const canonicalRequest = this.createCanonicalRequest(method, path, query, options.headers, payload)
    const stringToSign = this.createStringToSign(options.timestamp, options.region, service, canonicalRequest)
    query['X-Amz-Signature'] = this.createSignature(options.secret, options.timestamp, options.region, service, stringToSign)
    return options.protocol + '://' + host + path + '?' + querystring.stringify(query)
  }

  toTime(time: string | number | Date) {
    // eslint-disable-next-line no-useless-escape
    return new Date(time).toISOString().replace(/[:\-]|\.\d{3}/g, '')
  }

  toDate(time: string | number | Date) {
    return this.toTime(time).substring(0, 8)
  }

  hmac(key: string, string: string, encoding?: string) {
    return crypto.createHmac('sha256', key)
    .update(string, 'utf8')
    .digest(encoding)
  }

  hash(string: any, encoding: string) {
    return crypto.createHash('sha256')
    .update(string, 'utf8')
    .digest(encoding)
  }

  createWebSocketURL(args: { region: any; accessKeyId: string; secretAccessKey: string; languageCode?: string; sampleRate?: number }) {
    const endpoint = `transcribestreaming.${args.region}.amazonaws.com:8443`
    return this.createPreSignedURL(
      'GET',
      endpoint,
      '/stream-transcription-websocket',
      'transcribe',
      crypto.createHash('sha256').update('', 'utf8').digest('hex'),
      {
        key: args.accessKeyId,
        secret: args.secretAccessKey,
        protocol: 'wss',
        expires: 60,
        region: args.region,
        query: querystring.stringify({
          'media-encoding': 'pcm',
          'language-code': args.languageCode || 'en-US',
          'sample-rate': args.sampleRate || 16000,
          // type: 'DICTATION',
        }),
      }
    )
  }
}

