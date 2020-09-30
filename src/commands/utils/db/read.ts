import {Command, flags} from '@oclif/command'
import {cli} from 'cli-ux'
import {Pool} from 'pg'
import parsedDatabaseURL from '../../../utils/database/parsed-database-url'

const builder = require('knex')

export default class DatabaseRead extends Command {
  static description = 'read from a database table'

  static examples = [
    '$ db:read --table friends',
    '$ db:read --table friends --database people',
    '$ db:read --table friends --limit 2',
    '$ db:read --table friends --limit 10 --offset 2',
  ]

  static flags = {
    database: flags.string({description: 'database name', required: false}),
    'database-url': flags.string({description: 'database url', required: false, env: 'DATABASE_URL'}),
    limit: flags.integer({description: 'sql select limit', required: false, default: 100}),
    offset: flags.integer({description: 'sql select offset', required: false, default: 0}),
    table: flags.string({description: 'database table', required: true}),
    ...cli.table.flags(),
  }

  async run() {
    const {flags} = this.parse(DatabaseRead)

    const table = flags.table

    // MARK: Ensure database url is set
    if (!flags['database-url']) {
      this.error('Missing value for database-url. Either pass it as --database-url or set DATABASE_URL as an environment variable')
    }

    // MARK: Configure database connection and knex adapter
    const databaseURL = parsedDatabaseURL(flags['database-url'])

    const config = {
      ...databaseURL,
      database: flags.database || databaseURL.database,
    }

    const connection = new Pool(config)

    const knex = builder(config)

    // MARK: Prepare SQL query
    const query = knex
    .select()
    .from(table)
    .limit(flags.limit)
    .offset(flags.offset)
    .toString()

    // MARK: Read database table
    try {
      await connection
      .query(query)
      .then((data: { rows: any[] }) => {
        const columns: any = {}

        const rows: any[] = data.rows || []
        if (rows.length === 0) {
          this.log('No data found.')
          this.exit(0)
        }

        // MARK: Prepare data for CLI table
        // eslint-disable-next-line array-callback-return
        Object.keys(rows[0]).map((key: any) => {
          columns[key] = Object.assign({}, key)
        })

        return cli.table(data.rows, columns, {
          printLine: this.log,
          ...flags,
        })
      })
    } catch (error) {
      this.error(error)
    }
  }
}
