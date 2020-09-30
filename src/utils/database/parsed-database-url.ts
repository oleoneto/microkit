const URL = require('url').URL

export default (url: string) => {
  // Expects database connection strings of the form:
  // {client}://{username}:{password}@{host}:{port}/{database}

  const {
    port,
    password,
    protocol: c,
    pathname: name,
    hostname: host,
    username: user,
  } = new URL(url)

  const client = c.replace(':', '')
  const database = name.replace('/', '')

  return {
    client, // database client
    host,
    port,
    user,
    password,
    database,
  }
}
