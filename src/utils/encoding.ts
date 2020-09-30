const decode = (value: ArrayBuffer | SharedArrayBuffer | string, encoder: any = 'base64') => {
  return Buffer.from(value || '', encoder).toString('ascii')
}

const encode = (value: ArrayBuffer | SharedArrayBuffer | string, decoder: any = 'ascii') => {
  return Buffer.from(value || '', decoder).toString('base64')
}

module.exports = {
  decode,
  encode,
}
