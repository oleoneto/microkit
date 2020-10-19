import Axios from 'axios'

const get = (baseURL: string | undefined, path: string, headers: object | undefined) => {
  const axios = Axios.create({
    baseURL,
    headers,
  })

  return new Promise((resolve, reject) => {
    axios
    .get(path)
    .then((data: { data: unknown }) => resolve(data.data))
    .catch((error: any) => reject(error))
  })
}

const put = (baseURL: string | undefined, path: string, headers: object | undefined, data: any) => {
  const axios = Axios.create({
    baseURL,
    headers,
  })

  return new Promise((resolve, reject) => {
    axios
    .put(path, data)
    .then((data: { data: unknown }) => resolve(data.data))
    .catch((error: any) => reject(error))
  })
}

module.exports = {
  get,
  put,
}
