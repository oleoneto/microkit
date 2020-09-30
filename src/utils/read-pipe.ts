export const readPipe: () => Promise<string | undefined> = () => {
  /*
   * Source:
   * https://github.com/Yukaii/pipe-demo/blob/182ea821acc6c52a5482537de85c7001e2056e61/src/read-stdin-stream.ts
  */
  return new Promise(resolve => {
    const stdin = process.openStdin()

    stdin.setEncoding('utf-8')

    let data = ''

    stdin.on('data', chunk => {
      data += chunk
    })

    stdin.on('end', () => resolve(data))

    if (stdin.isTTY) resolve('')
  })
}
