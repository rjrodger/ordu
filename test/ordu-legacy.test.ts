/* Copyright (c) 2016-2020 Richard Rodger, MIT License */

import { LegacyOrdu } from '../dist/ordu'
import { describe, it } from 'node:test'
import * as Code from '@hapi/code'

const expect = Code.expect
const Ordu = LegacyOrdu

describe('ordu-legacy', function() {
  it('construct', async () => {
    const w = Ordu()
    expect(w).to.exist()

    const wn = ('' + w).replace(/ordu\d+/g, 'ordu0')
    expect(wn).to.equal('ordu0:[]')
  })

  it('readme-example', async () => {
    const w = Ordu()

    w.add(function first(ctxt: any, data: any) {
      if (null == data.foo) {
        return { kind: 'error', why: 'no foo' }
      }

      data.foo = data.foo.substring(0, ctxt.len)
    })

    w.add({ tags: ['upper'] }, function second(_ctxt: any, data: any) {
      data.foo = data.foo.toUpperCase()
    })

    const ctxt = { len: 3 }
    let data: any = { foo: 'green' }

    w.process(ctxt, data)
    expect(data.foo).equal('GRE')
    // console.log(data.foo) // prints 'GRE' (first, second)

    data = { foo: 'blue' }
    w.process({ tags: ['upper'] }, ctxt, data)
    // console.log(data.foo) // prints 'BLUE' (second)
    expect(data.foo).equals('BLUE')

    data = [] as any
    const res = w.process(ctxt, data)
    // console.log(res) // prints {kind: 'error', why: 'no foo', ... introspection ...}
    expect(res).equals({
      ctxt$: {
        index$: 0,
        taskname$: 'first',
        len: 3,
      },
      data$: [],
      index$: 0,
      taskname$: 'first',
      kind: 'error',
      why: 'no foo',
    })
  })

  it('happy', async () => {
    const w = Ordu()

    w.add(function(ctxt: any, data: any) {
      data.x = 1
    })

    const ctxt = {}
    let data: any = {}

    expect(data.x).to.not.exist()

    let res = w.process(ctxt, data)

    expect(res).to.not.exist()
    expect(data.x).to.equal(1)

    w.add(function failer(ctxt: any, data: any) {
      return { kind: 'error' }
    })

    data = {}
    res = w.process(ctxt, data)

    expect(data.x).to.equal(1)
    expect(res.kind).to.equal('error')
    expect(res.index$).to.equal(1)
    expect(res.taskname$).to.equal('failer')
    expect(res.ctxt$).to.equal(ctxt)
    expect(res.data$).to.equal(data)

    const wn = ('' + w).replace(/ordu\d+/g, 'ordu1')
    expect(wn).to.equal('ordu1:[ordu1_task0,failer]')
  })

  it('list', async () => {
    const w = Ordu({ name: 'foo' })

    w.add(function zero() { })
      .add(function() { })
      .add(function two() { })

    expect(w.tasknames()).to.equal(['zero', 'foo_task1', 'two'])
    expect(w.taskdetails()).to.equal([
      'zero:{tags:}',
      'foo_task1:{tags:}',
      'two:{tags:}',
    ])
    expect('' + w).to.equal('foo:[zero,foo_task1,two]')
  })

  it('process', async () => {
    const w = Ordu({ name: 'tags' })

    w.add(function zero(c: any, d: any) {
      d.zero = true
    })

    let data: any = {}
    expect(w.process()).to.equal(null)
    expect(data.zero).to.not.exist()

    data = {}
    expect(w.process(data)).to.equal(null)
    expect(data.zero).to.be.true()

    data = {}
    expect(w.process({}, data)).to.equal(null)
    expect(data.zero).to.be.true()

    data = {}
    expect(w.process({}, {}, data)).to.equal(null)
    expect(data.zero).to.be.true()
  })

  it('tags', async () => {
    const w = Ordu({ name: 'tags' })

    w.add({ tags: ['red'] }, function zero(c: any, d: any) {
      d.push('zero')
    })

    w.add({ tags: [] }, function one(c: any, d: any) {
      d.push('one')
    })

    w.add(function two(c: any, d: any) {
      d.push('two')
    })

    let data: any = []
    expect(w.process({}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'one', 'two'])

    data = []
    expect(w.process({ tags: ['red'] }, {}, data)).to.equal(null)
    expect(data).to.equal(['zero'])

    w.add({ tags: ['red', 'blue'] }, function three(c: any, d: any) {
      d.push('three')
    })

    data = []
    expect(w.process({ tags: ['blue', 'red'] }, {}, data)).to.equal(null)
    expect(data).to.equal(['three'])

    data = []
    expect(w.process({ tags: ['red'] }, {}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'three'])

    data = []
    expect(w.process({ tags: ['blue'] }, {}, data)).to.equal(null)
    expect(data).to.equal(['three'])

    data = []
    expect(w.process({ tags: [] }, {}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'one', 'two', 'three'])
  })
})
