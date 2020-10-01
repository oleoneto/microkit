const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

const DEFAULTS = {
  duration: '0',
  mode: {
    rms: 'rms',
    peak: 'peak',
  },
  periods: 1,
  window: '0.02',
}

export default (file: string, location?: string, prefix?: string) => new Promise((resolve, reject) => {
  let dir = location || './'
  if (!dir.endsWith('/')) dir += '/'

  const basename = path.basename(file)

  const fileFormat = `${path.parse(file).ext}`.replace('.', '')

  const inputFile = `${dir}${basename}`

  const filepath = prefix ? `${dir}${prefix}${basename}` : `${dir}${basename}`

  const fileStream = fs.createWriteStream(filepath)

  const command = ffmpeg(inputFile)
  .format(fileFormat)
  .noVideo()
  .audioFilters([
    {
      filter: 'silenceremove',
      options: {
        start_periods: DEFAULTS.periods,
        start_duration: DEFAULTS.duration,
        detection: DEFAULTS.mode.peak,
        window: DEFAULTS.window,
      },
    },
  ])

  command
  .on('error', (error: any) => reject(error))
  .on('end', () => resolve())
  .pipe(fileStream, {end: true})
})
