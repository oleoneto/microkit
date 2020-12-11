/* eslint-disable no-console */
/* eslint-disable new-cap */
const Client = require('ari-client')
const EventsEmitter = require('events')

const Events = {
  close: 'close',
  done: 'done',
  ready: 'ready',
  ariDialing: 'dialing',
  ariStart: 'start',
  bridgeCreated: 'BridgeCreated',
  bridgeDestroyed: 'BridgeDestroyed',
  channelAddedToBridge: 'ChannelAddedToBridge',
  channelCreated: 'ChannelCreated',
  channelDestroyed: 'ChannelDestroyed',
  channelHangup: 'ChannelHangup',
  stasisStart: 'StasisStart',
  stasisEnd: 'StasisEnd',
}

export default class AriController extends EventsEmitter {
  protected ari: any;

  protected address: string;

  protected username: string;

  protected password: string;

  protected name: string;

  protected isClosing = false;

  protected bridge: any;

  protected channel: any;

  protected externalMedia: any;

  protected enableExternalMedia = false;

  constructor(args: {address: string; username: string; password: string}, name: string, options?: {enableExternalMedia: boolean}) {
    super()
    this.address = args.address
    this.username = args.username
    this.password = args.password
    this.name = name
    this.enableExternalMedia = options?.enableExternalMedia || false
    this.ari = Client

    this.on(Events.ariStart, (name: string) => console.log('☎️ Ari application started', name))
    this.on(Events.ariDialing, (endpoint: string, codec: string) => console.log(`☎️ Ari is dialing ${endpoint} with codec ${codec}`))
    this.on(Events.bridgeCreated, (id: string) => console.log('☎️ Bridge created', id))
    this.on(Events.bridgeDestroyed, (id: string) => console.log('☎️ Bridge destroyed', id))
    this.on(Events.channelAddedToBridge, (bridgeId: string, id: string) => {
      console.log('☎️ Channel added to bridge', bridgeId, id)
    })
    this.on(Events.channelCreated, (id: string) => console.log('☎️ Channel created', id))
    this.on(Events.channelDestroyed, (id: string) => console.log('☎️ Channel destroyed', id))

    process.on('SIGINT', async () => {
      await this.close()
      process.exit(0)
    })
  }

  async dial(dialString: string, options?: {format: string; externalMediaHost: string}) {
    this.ari = await Client.connect(this.address, this.username, this.password)
    await this.ari.start(this.name)
    this.emit(Events.ariStart, this.name)

    // MARK: Setup Bridge
    this.bridge = this.ari.Bridge()
    try {
      await this.bridge.create({type: 'mixing'})
      this.emit(Events.bridgeCreated, this.bridge.id)
      this.bridge.on(Events.bridgeDestroyed, async () => this.close())
    } catch (error) {
      console.error(error)
      await this.close()
    }

    // MARK: Connect Channel
    this.channel = this.ari.Channel()
    this.channel.on(Events.stasisStart, (_: any, channel: {id: string}) => {
      this.bridge.addChannel({channel: channel.id})
      // this.emit(Events.channelAddedToBridge, this.bridge.id, channel.id)
      this.emit(Events.channelCreated, channel.id)
    })
    this.channel.on(Events.stasisEnd, async () => this.close())

    // MARK: Dial workflow
    try {
      const codec = options?.format || 'ulaw'
      await this.channel.originate({
        endpoint: dialString,
        formats: codec,
        app: this.name,
      })
      this.emit(Events.ariDialing, dialString, codec)
    } catch (error) {
      await this.close()
    }

    // MARK: External Media
    // =====================
    if (this.enableExternalMedia) {
      this.externalMedia = this.ari.Channel()
      this.externalMedia.on(Events.stasisStart, (_: any, channel: { id: string }) => {
        this.bridge.addChannel({channel: channel.id})
        this.emit(Events.channelCreated)
        this.emit(Events.channelCreated)
      })
      this.externalMedia.on(Events.stasisEnd, async () => this.close())

      try {
        const channel = await this.externalMedia.externalMedia({
          app: this.name,
          external_host: options?.externalMediaHost,
          format: options?.format,
        })

        /**
         *
         * External media channel looks like the following:
         *
         * {
         *   channel: {
         *     id: '5374cae5-f53e-4d9e-96f3-b4b2a32ca6dc',
         *     name: 'UnicastRTP/host.docker.internal-0x561b84030aa0',
         *     state: 'Down',
         *     caller: { name: '', number: '' },
         *     connected: { name: '', number: '' },
         *     accountcode: '',
         *     dialplan: {
         *        context: 'default',
         *        exten: 's',
         *        priority: 1,
         *        app_name: 'AppDial2',
         *        app_data: '(Outgoing Line)'
         *     },
         *     creationtime: '2020-10-22T02:46:22.021+0000',
         *     language: 'en',
         *     channelvars: {
         *       UNICASTRTP_LOCAL_PORT: '10008',
         *       UNICASTRTP_LOCAL_ADDRESS: '172.19.0.2'
         *     }
         *   },
         *   local_port: 10008,
         *   local_address: '172.19.0.2'
         * }
        */

        console.log('☎️ External media using coded', options?.format)
        console.log('☎️ External media started at', options?.externalMediaHost)
        console.log('☎️ External media channel id', channel.channel.id)
        console.log('☎️ External media channel name', channel.channel.name)
        console.log('☎️ External media channel variables', channel.channel.channelvars)
      } catch (error) {
        await this.close()
      }
    }

    this.emit(Events.ready)
  }

  async close() {
    if (this.isClosing) return

    if (this.channel) {
      try {
        console.log('☎️ Hanging up channel', this.channel.id)
        await this.channel.hangup()
      } catch (error) {}
      delete this.channel
    }

    if (this.externalMedia) {
      try {
        console.log('☎️ Hanging up external media', this.externalMedia.id)
        await this.externalMedia.hangup()
      } catch (error) {}
      delete this.externalMedia
    }

    if (this.bridge) {
      try {
        console.log('☎️ Destroying bridge', this.bridge.id)
        await this.bridge.destroy()
      } catch (error) {}
      delete this.bridge
    }

    await this.ari.stop()
    this.emit(Events.done)
  }
}
