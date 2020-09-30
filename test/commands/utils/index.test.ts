import {expect, test} from '@oclif/test'

describe('utils:index', () => {
  test
  .stdout()
  .command(['utils:index'])
  .it('does nothing', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
