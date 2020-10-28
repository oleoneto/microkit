// MARK: Time helpers

// eslint-disable-next-line no-useless-escape
export const toTime = (time: string | number | Date) => new Date(time).toISOString().replace(/[:\-]|\.\d{3}/g, '')

export const toDate = (time: string | number | Date) => toTime(time).substring(0, 8)
