export const queryFromObject = (data: { [s: string]: unknown } | ArrayLike<unknown>) => {
  let options = ''
  Object.entries(data).map(option => {
    options += `${option[0]}=${option[1]}&`
    return options
  })
  // eslint-disable-next-line no-useless-escape
  return options.replace(/([\?]|[\&])$/g, '')
}
