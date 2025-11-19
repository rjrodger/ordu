/* Copyright (c) 2016-2021 Richard Rodger, MIT License */

import { Ordu, Task } from '../dist/ordu'
import { describe, it } from 'node:test'
import * as Code from '@hapi/code'

const expect = Code.expect

describe('deep', function() {

  it('basic-sync', async () => {
    const r0 = new Ordu()

    function f0(t: any) {
      t.data.f0 = 0
    }

    function f1(t: any) {
      t.data.f1 = 1
    }

    function g0(t: any) {
      t.data.g.push(t.node.val.x)
    }

    function g1(t: any) {
      t.data.g.push(t.node.val.x * 2)
    }


    const d0 = {
      list0: [
        { x: 0 },
        { x: 1 },
      ],
      g: []
    }

    r0.add([
      f0,
      {
        select: 'list0', apply: [
          g0,
          g1,
        ]
      },
      f1
    ])

    const o0 = r0.execSync({}, d0)

    // console.dir(o0.data, { depth: null })

    expect(o0.data)
      .equal({ list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 })
  })


  it('basic-async', async () => {
    const r0 = new Ordu()

    async function f0(t: any) {
      await new Promise((r) => setTimeout(r, 11))
      t.data.f0 = 0
    }

    async function f1(t: any) {
      await new Promise((r) => setTimeout(r, 11))
      t.data.f1 = 1
    }

    async function g0(t: any) {
      await new Promise((r) => setTimeout(r, 11))
      t.data.g.push(t.node.val.x)
    }

    async function g1(t: any) {
      await new Promise((r) => setTimeout(r, 11))
      t.data.g.push(t.node.val.x * 2)
    }


    const d0 = {
      list0: [
        { x: 0 },
        { x: 1 },
      ],
      g: []
    }

    r0.add([
      f0,
      {
        select: 'list0', apply: [
          g0,
          g1,
        ]
      },
      f1
    ])

    const o0 = await r0.exec({}, d0)

    // console.dir(o0.data, { depth: null })

    expect(o0.data)
      .equal({ list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 })
  })



  it('levels', async () => {
    const r0 = new Ordu()

    function collect(t: any) {
      t.data.n.push(t.node.val.n)
    }

    const d0 = {
      x: {
        x0: {
          y0: { n: 0 },
          y1: { n: 1 },
        },
        x1: {
          y0: { n: 2 },
          y1: { n: 3 },
        }
      },
      n: []
    }

    r0.add([{
      select: 'x', apply: [{
        select: '', apply: collect
      }],
    }])

    const o0 = r0.execSync({}, d0)

    // console.dir(o0.data, { depth: null })

    expect(o0.data.n).equal([0, 1, 2, 3])
  })


  it('custom', async () => {
    const r0 = new Ordu()

    function collect(t: any) {
      t.data.n.push(t.node.val.n)
    }

    const d0 = {
      x: {
        x0: {
          y0: { n: 0 },
          y1: { n: 1 },
        },
        x1: {
          y0: { n: 2 },
          y1: { n: 3 },
        }
      },
      n: []
    }

    r0.add([{
      select: (source: any) => {
        const children =
          Object.values(
            Object.entries(
              source.x).filter(n => n[0] === 'x1').map(n => n[1])[0] as any)
        return children
      },
      apply: collect,
    }])

    const o0 = r0.execSync({}, d0)

    expect(o0.data.n).equal([2, 3])
  })



})
