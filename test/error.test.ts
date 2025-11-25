/* Copyright (c) 2016-2025 Richard Rodger, MIT License */

import { Ordu } from '..'
import type { TaskSpec } from '..'
import { describe, it } from 'node:test'
import * as Code from '@hapi/code'

const expect = Code.expect

describe('error', function() {

  it('basic-capture', async () => {
    const r0 = new Ordu()

    function f0(t: TaskSpec) {
      t.data.f0 = 0
    }

    function f1(_t: TaskSpec) {
      throw new Error('f1')
    }

    function f2(t: TaskSpec) {
      t.data.f2 = 1
    }

    const d0 = {
    }

    r0.add([
      f0,
      f1,
      f2,
    ])

    const o0 = r0.execSync({}, d0)

    expect(o0?.err?.message).equal('f1')
  })
})
