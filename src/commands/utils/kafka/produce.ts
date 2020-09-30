/* eslint-disable unicorn/no-process-exit */
import {Command, flags} from '@oclif/command'
import * as moment from 'moment'
import * as kafka from 'kafka-node'

export default class KafkaProduce extends Command {
  static description = 'produce kafka messages'

  static examples = [
    '$ kafka:produce --topic user-registration',
    '$ kafka:produce --topic user-registration',
    '$ kafka:produce --topic user-registration --total 10',
    '$ kafka:produce --topic user-registration --total 10 --object \'{"id": 8897, "typeId": 43, "username": "lneto"}\'',
  ]

  static flags = {
    action: flags.string({char: 'a', description: 'kafka topic action', required: false}),
    host: flags.string({
      description: 'address of kafka host [i.e. https://example.com:9094]',
      required: false,
      env: 'KAFKA_HOST',
    }),
    object: flags.string({
      char: 'o',
      description: 'payload in JSON format',
      required: true,
      default: '{"origin": "microkit"}',
    }),
    topic: flags.string({char: 't', description: 'kafka topic', required: true}),
    total: flags.integer({description: 'number of messages to send', default: 1}),
  }

  static producer: kafka.Producer

  produce(topic: any, messages: any) {
    const data = Array.isArray(messages) ? messages : [messages]

    const pendingMessages: { topic: any; messages: string }[] = []

    data.forEach(message => {
      const {content} = message

      const formattedMessage = {
        topic,
        messages: JSON.stringify({
          ...content,
          timestamp: moment().utc().toISOString(),
        }),
      }

      pendingMessages.push(formattedMessage)
    })

    KafkaProduce.producer.send(pendingMessages, () => process.exit())
  }

  async run() {
    const {flags} = this.parse(KafkaProduce)

    // MARK: Ensure host is set
    if (!flags.host) {
      this.error('Missing host. Either pass it with --host or set KAFKA_HOST as an environment variable.')
    }

    // MARK: Initialize and prepare Kafka Producer
    const topic = flags.topic
    KafkaProduce.producer = new kafka.Producer(
      new kafka.KafkaClient({
        kafkaHost: flags.host,
        sslOptions: {},
      })
    )

    KafkaProduce.producer.on('ready', () => {
      KafkaProduce.producer.createTopics(
        [
          topic,
        ],
        () => null, // ignore error...
      )
    })

    KafkaProduce.producer.on('error', error => this.error(error))

    // MARK: Prepare messages to be produced

    const object = JSON.parse(flags.object)

    // MARK: Produce messages

    for (let index = 0; index < flags.total; index++) {
      this.produce(
        topic,
        {
          content: {
            action: flags.action,
            ...object,
          },
        },
      )
    }

    // MARK: Done producing event
    this.log(`${flags.total} message(s) sent.`)
  }
}
