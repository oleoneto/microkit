/* eslint-disable no-console */
const WebSocket = require('ws')
const EventsEmitter = require('events')
require('dotenv').config()

const {DEEPGRAM_API_KEY, DEEPGRAM_API_SECRET} = process.env
const URL = 'wss://brain.deepgram.com/v2/listen/stream?encoding=mulaw&model=phonecall&multichannel=true&sample_rate=8000&interim_results=false'
const CREDENTIALS = Buffer.from(`${DEEPGRAM_API_KEY}:${DEEPGRAM_API_SECRET}`).toString('base64')

export default class Deepgram extends EventsEmitter {
  public stream: any

  protected isOpen = false

  protected socket: WebSocket

  protected current: any[];

  protected history: any[];

  protected buffer: any[];

  constructor() {
    super()

    this.current = []
    this.history = []
    this.buffer = []

    this.socket = new WebSocket(URL, ['Basic', CREDENTIALS])

    this.stream = WebSocket.createWebSocketStream(this.socket)

    this.socket.addEventListener('error', (error: any) => console.error(error))
    this.socket.addEventListener('open', () => {
      console.log('👂 Connected to deepgram')
      this.isOpen = true
      this.emit('ready')
    })
    this.socket.addEventListener('message', (message: { data: string }) => {
      const d = JSON.parse(message.data)
      // eslint-disable-next-line no-prototype-builtins
      if (d.hasOwnProperty('channel')) {
        this.current.push(d.channel.alternatives[0])
        this.history.push(d.channel.alternatives[0])
      }
      this.log()
    })

    this.stream.on('data', (data: any) => this.buffer.push(data))

    this.socket.onclose = () => {
      this.showConversation()
      console.log(`👂 Deepgram connection closed. Buffer size: ${this.buffer.length}`)
    }

    process.on('SIGINT', () => {
      if (this.isOpen) this.socket.close()
      else this.showConversation()
      this.emit('close')
    })
  }

  close() {
    this.socket.close()
  }

  log() {
    let transcript = ''
    this.current.forEach((entry: { transcript: any; words: any }) => {
      transcript += `${entry.transcript} `
    })

    this.current = []
    console.log(transcript)
  }

  showConversation() {
    let transcript = ''
    this.history.forEach((entry: { transcript: any; words: any }) => {
      transcript += `${entry.transcript} `
    })

    console.log('================= \n')
    console.log('Final Transcript: \n')
    console.log(transcript)
    console.log('================= \n')
  }
}
