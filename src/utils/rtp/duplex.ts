const {PassThrough} = require('stream')

export default class DuplexThrough {
  protected in: { end: () => void };

  protected out: { end: () => void };

  constructor() {
    this.in = new PassThrough()
    this.out = new PassThrough()
  }

  end() {
    this.in.end()
    this.out.end()
  }
}
