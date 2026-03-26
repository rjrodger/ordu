/* Copyright (c) 2016-2020 Richard Rodger, MIT License */

import { LegacyOrdu } from '../dist/ordu'
import { describe, it } from 'node:test'
import assert from 'node:assert'

const Ordu = LegacyOrdu

describe('ordu-legacy', function() {
  it('construct', async () => {
    const w = Ordu()
    assert.ok(w != null)

    const wn = ('' + w).replace(/ordu\d+/g, 'ordu0')
    assert.strictEqual(wn, 'ordu0:[]')
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
    assert.strictEqual(data.foo, 'GRE')
    // console.log(data.foo) // prints 'GRE' (first, second)

    data = { foo: 'blue' }
    w.process({ tags: ['upper'] }, ctxt, data)
    // console.log(data.foo) // prints 'BLUE' (second)
    assert.strictEqual(data.foo, 'BLUE')

    data = [] as any
    const res = w.process(ctxt, data)
    // console.log(res) // prints {kind: 'error', why: 'no foo', ... introspection ...}
    assert.deepStrictEqual(res, {
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

    assert.ok(data.x == null)

    let res = w.process(ctxt, data)

    assert.ok(res == null)
    assert.strictEqual(data.x, 1)

    w.add(function failer(ctxt: any, data: any) {
      return { kind: 'error' }
    })

    data = {}
    res = w.process(ctxt, data)

    assert.strictEqual(data.x, 1)
    assert.strictEqual(res.kind, 'error')
    assert.strictEqual(res.index$, 1)
    assert.strictEqual(res.taskname$, 'failer')
    assert.strictEqual(res.ctxt$, ctxt)
    assert.strictEqual(res.data$, data)

    const wn = ('' + w).replace(/ordu\d+/g, 'ordu1')
    assert.strictEqual(wn, 'ordu1:[ordu1_task0,failer]')
  })

  it('list', async () => {
    const w = Ordu({ name: 'foo' })

    w.add(function zero() { })
      .add(function() { })
      .add(function two() { })

    assert.deepStrictEqual(w.tasknames(), ['zero', 'foo_task1', 'two'])
    assert.deepStrictEqual(w.taskdetails(), [
      'zero:{tags:}',
      'foo_task1:{tags:}',
      'two:{tags:}',
    ])
    assert.strictEqual('' + w, 'foo:[zero,foo_task1,two]')
  })

  it('process', async () => {
    const w = Ordu({ name: 'tags' })

    w.add(function zero(c: any, d: any) {
      d.zero = true
    })

    let data: any = {}
    assert.strictEqual(w.process(), null)
    assert.ok(data.zero == null)

    data = {}
    assert.strictEqual(w.process(data), null)
    assert.strictEqual(data.zero, true)

    data = {}
    assert.strictEqual(w.process({}, data), null)
    assert.strictEqual(data.zero, true)

    data = {}
    assert.strictEqual(w.process({}, {}, data), null)
    assert.strictEqual(data.zero, true)
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
    assert.strictEqual(w.process({}, data), null)
    assert.deepStrictEqual(data, ['zero', 'one', 'two'])

    data = []
    assert.strictEqual(w.process({ tags: ['red'] }, {}, data), null)
    assert.deepStrictEqual(data, ['zero'])

    w.add({ tags: ['red', 'blue'] }, function three(c: any, d: any) {
      d.push('three')
    })

    data = []
    assert.strictEqual(w.process({ tags: ['blue', 'red'] }, {}, data), null)
    assert.deepStrictEqual(data, ['three'])

    data = []
    assert.strictEqual(w.process({ tags: ['red'] }, {}, data), null)
    assert.deepStrictEqual(data, ['zero', 'three'])

    data = []
    assert.strictEqual(w.process({ tags: ['blue'] }, {}, data), null)
    assert.deepStrictEqual(data, ['three'])

    data = []
    assert.strictEqual(w.process({ tags: [] }, {}, data), null)
    assert.deepStrictEqual(data, ['zero', 'one', 'two', 'three'])
  })
})
