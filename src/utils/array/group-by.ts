export const groupBy = (key: any, array: any[]) => {
  return array.reduce((result, value) => {
    if (!result[value[key]]) result[value[key]] = []

    result[value[key]].push(value)

    return result
  }, {})
}
