export const distinctByKey = (key: any, array: any[]) => {
  const result = []
  const map = new Map()

  for (const item of array) {
    if (!map.has(item[key])) {
      map.set(item[key], true)
      result.push(item)
    }
  }

  return result
}
