import {HexBase64Latin1Encoding} from 'crypto'
import {toDate, toTime} from '../date'
import {queryFromObject} from '../query-from-object'

const crypto = require('crypto')

// MARK: - Crypto helpers

const hash = (string: any, encoding: HexBase64Latin1Encoding) => {
  return crypto.createHash('sha256').update(string, 'utf8').digest(encoding)
}

const createSignatureKey = (secret: string, time: any, region: any, service: any) => {
  const kDate = crypto.createHmac('sha256', `AWS4${secret}`).update(toDate(time), 'utf8').digest('hex')
  const kRegion = crypto.createHmac('sha256', kDate).update(region, 'utf8').digest('hex')
  const kService = crypto.createHmac('sha256', kRegion).update(service, 'utf8').digest('hex')
  return crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest('hex')
}

// eslint-disable-next-line max-params
const createSignature = (signatureKey: string, signingKey: string) => {
  return crypto.createHmac('sha256', signatureKey).update(signingKey, 'utf8').digest('hex')
}

const createCredentialScope = (time: any, region: any, service: any) => {
  return [toDate(time), region, service, 'aws4_request'].join('/')
}

const createSignedHeaders = (headers: {}) => {
  return Object.keys(headers).sort().map(function (name) {
    return name.toLowerCase().trim()
  }).join(';')
}

const createCanonicalHeaders = (headers: { [x: string]: { toString: () => string } }) => {
  return Object.keys(headers).sort().map(function (name) {
    return name.toLowerCase().trim() + ':' + headers[name].toString().trim() + '\n'
  }).join('')
}

// eslint-disable-next-line max-params
const createCanonicalRequest = (method: string, pathname: any, query: any, headers: any, payload: any) => {
  return [
    method.toUpperCase(),
    pathname,
    queryFromObject(query),
    createCanonicalHeaders(headers),
    createSignedHeaders(headers),
    payload,
  ].join('\n')
}

const createSigningString = (time: any, region: any, service: any, request: any) => {
  return [
    'AWS4-HMAC-SHA256',
    toTime(time),
    createCredentialScope(time, region, service),
    hash(request, 'hex'),
  ].join('\n')
}

export const createPreSignedURL = (host: string, path: string, service: any, options: {
  key?: any;
  secret?: any;
  headers?: any;
  timestamp?: any;
  region?: any;
  expires?: any;
  sessionToken?: any;
// eslint-disable-next-line max-params
}) => {
  options = options || {}
  options.key = options.key || process.env.AWS_ACCESS_KEY_ID
  options.secret = options.secret || process.env.AWS_SECRET_ACCESS_KEY
  options.headers = options.headers || {}
  options.timestamp = options.timestamp || Date.now()
  options.region = options.region || process.env.AWS_REGION || 'us-east-1'
  options.expires = options.expires || 86400 // 24 hours
  options.headers = options.headers || {}

  // host is required
  options.headers.Host = host

  const protocol = 'https'

  const query: any = {}
  query['X-Amz-Algorithm'] = 'AWS4-HMAC-SHA256'
  query['X-Amz-Credential'] = options.key + '/' + createCredentialScope(options.timestamp, options.region, service)
  query['X-Amz-Date'] = toTime(options.timestamp)
  query['X-Amz-Expires'] = options.expires
  query['X-Amz-SignedHeaders'] = createSignedHeaders(options.headers)
  if (options.sessionToken) {
    query['X-Amz-Security-Token'] = options.sessionToken
  }

  const payloadHash = hash('', 'hex')

  const canonicalRequest = createCanonicalRequest('GET', path, query, options.headers, payloadHash)
  const signingString = createSigningString(options.timestamp, options.region, service, canonicalRequest)
  const signatureKey = createSignatureKey(options.secret, options.timestamp, options.region, service)
  query['X-Amz-Signature'] = createSignature(signatureKey, signingString)
  return protocol + '://' + host + path + '?' + queryFromObject(query)
}
