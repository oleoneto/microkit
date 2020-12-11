export const convertToFloat32Array = (arr: Uint8Array) => {
  let i
  const l = arr.length

  const result = new Float32Array(arr.length)

  for (i = 0; i < l; i++) {
    result[i] = (arr[i] - 128) / 128.0
  }

  return result
}
