/* eslint-disable unicorn/no-process-exit */
import {Command, flags} from '@oclif/command'
import * as kafka from 'kafka-node'

require('dotenv').config()

export default class KafkaListen extends Command {
  static description = 'listen for or consume Kafka events'

  static examples = [
    '$ microkit utils:kafka:listen --topics feed',
    '$ microkit utils:kafka:listen --topics feed registrations',
    '$ microkit utils:kafka:listen --topics feed --listen-once',
    '$ microkit utils:kafka:listen --topics feed --actions like comment --mode watch',
    '$ microkit utils:kafka:listen --topics feed --actions repost --mode --ignore',
  ]

  static flags = {
    keys: flags.string({
      description: 'kafka keys to watch for',
      required: false,
      multiple: true,
      dependsOn: ['mode'],
    }),
    mode: flags.enum({
      description: 'determine whether to care about or ignore these keys',
      required: false,
      options: ['watch', 'ignore'],
      dependsOn: ['keys'],
    }),
    groupId: flags.string({
      char: 'g',
      description: 'kafka consumer group identifier',
      required: false,
      default: 'microkit',
    }),
    host: flags.string({
      description: 'address of kafka host [i.e. https://example.com:9094]',
      required: false,
      env: 'KAFKA_HOST',
    }),
    'listen-once': flags.boolean({description: 'stop listening once a message is received', required: false}),
    topics: flags.string({char: 't', description: 'kafka topic', required: true, multiple: true}),
    total: flags.integer({
      description: 'maximum number of messages to consume',
      required: false,
      exclusive: ['listen-once'],
    }),
  }

  static consumerGroup: kafka.ConsumerGroup

  static receivedMessages = 0

  static ignoredMessages = 0

  showMessageCount() {
    this.log('Received a total of', KafkaListen.receivedMessages, 'messages.', 'Ignored', KafkaListen.ignoredMessages, 'message(s)')
  }

  async run() {
    const {flags} = this.parse(KafkaListen)

    // MARK: Ensure host is set
    if (!flags.host) {
      this.error('Missing value for host. Either pass it as --host or set KAFKA_HOST as an environment variable')
    }

    const keys = flags.keys.map(value => {
      if (value.split(':').length <= 1) value = [value, null]
      else value = [value.split(':')[0], value.split(':')[1]]
      return value
    })

    // MARK: Setup ConsumerGroup

    const consumerTopics = flags.topics

    KafkaListen.consumerGroup = new kafka.ConsumerGroup({
      kafkaHost: flags.host,
      groupId: flags.groupId,
      protocol: ['roundrobin'],
      id: 'microkit',
      sslOptions: {},
    }, consumerTopics)

    KafkaListen.consumerGroup.on('error', error => {
      this.error('[ConsumerGroup] An error occurred: ', error)
    })

    // MARK: Consume messages

    KafkaListen.consumerGroup.on('message', message => {
      const {value} = message
      const parsedMessage = JSON.parse(value as string)
      // const keysToWatch = Object.keys(JSON.parse(value as string)) // ['key1', 'key2']
      // const valuesToWatch = Object.values(JSON.parse(value as string))

      const hasRelevantKeyValuePairs = keys.filter((arr: any[]) => {
        // this.log(parsedMessage[arr[0]])
        // console.log(parsedMessage.hasOwnProperty(arr[0]), parsedMessage[arr[0]] === arr[1])
        // this.log(arr[0], arr[1])
        // console.log(parsedMessage[arr[0]], arr[1])
        // eslint-disable-next-line no-prototype-builtins
        return parsedMessage.hasOwnProperty(arr[0]) && parsedMessage[arr[0]] === arr[1]
      })

      this.log({hasRelevantKeyValuePairs, keys})

      const shouldWatchAllMessages = flags.keys?.length === 0

      const shouldWatch = flags.mode === 'watch' ? hasRelevantKeyValuePairs.length > 0 : !hasRelevantKeyValuePairs

      const shouldCare = shouldWatchAllMessages || shouldWatch

      KafkaListen.receivedMessages += 1
      KafkaListen.ignoredMessages = shouldCare ? KafkaListen.ignoredMessages : KafkaListen.ignoredMessages + 1

      if (shouldCare) this.log(message as unknown as string)

      const doneConsuming = flags['listen-once'] || (flags.total && KafkaListen.receivedMessages === flags.total)
      if (doneConsuming) {
        this.showMessageCount()
        process.exit(0)
      }
    })

    // MARK: Handle interrupts
    process.on('SIGINT', () => {
      this.showMessageCount()
      KafkaListen.consumerGroup.close(() => process.exit(0))
    })
  }
}
