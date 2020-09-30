export const merge = (arrayA: any[], arrayB: any[]) => {
  return arrayA.map((item, index) => Object.assign({}, item, arrayB[index]))
}
