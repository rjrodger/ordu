/* Copyright (c) 2016-2021 Richard Rodger, MIT License */

import { Ordu, Task } from '../dist/ordu'
import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('ordu', function() {
  it('sanity', async () => {
    const h0 = new Ordu()
    assert.ok(h0 != null)
  })

  it('happy', async () => {
    const h0 = new Ordu()

    h0.add((spec: any) => ({
      op: 'merge',
      out: {
        y: spec.data.x * 10,
      },
    }))

    let o0 = await h0.exec({}, { x: 11 }, {})
    assert.deepStrictEqual(o0.data, { x: 11, y: 110 })

    let o1 = await h0.exec({}, { x: 22 }, {})
    assert.deepStrictEqual(o1.data, { x: 22, y: 220 })

    h0.add((spec: any) => ({
      op: 'merge',
      out: {
        z: spec.data.y / 100,
      },
    }))

    let o2 = await h0.exec({}, { x: 33 }, {})
    assert.deepStrictEqual(o2.data, { x: 33, y: 330, z: 3.3 })

    // let o3 = h0.execSync({},{x:33})
    // assert.deepStrictEqual(o3.data, {x:33, y:330, z:3.3})
  })

  it('basic', async () => {
    let ts = Task.count - 1

    const h0 = new Ordu()
    const taskresult_log: any[] = []
    const taskend_log: any[] = []

    h0.on('task-result', (tr) => {
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev) => {
      taskend_log.push(ev)
    })

    h0.add({
      name: 'A',
      // from: 'my-ref-01',
      meta: {
        from: { foo: 1 },
      },
    })

    h0.add({
      name: 'B',
      active: false,
      meta: null,
    })

    h0.add({
      exec: (spec: any) => {
        if (spec.ctx.err0) {
          throw new Error('err0')
        }
        if (spec.ctx.err2) {
          return { op: 'not-an-op' }
        }
        return null
      },
    })

    h0.add({
      id: '0',
      exec: () => ({
        op: 'merge',
        out: {
          x: 2,
        },
        why: 'some-reason',
      }),
    })

    h0.add({
      if: {
        x: 4,
        xx: 40,
      },
      exec: () => ({
        op: 'merge',
        out: {
          q: 1,
        },
      }),
    })

    h0.add({
      name: 'a',
      exec: async () => {
        return new Promise((r) =>
          setTimeout(() => {
            r({
              op: 'merge',
              // out missing!
            })
          }, 10)
        )
      },
    })

    h0.add(function b() {
      return {
        op: 'merge',
        out: {
          x: 4,
        },
      }
    })

    h0.add(function c() {
      return {
        op: 'lookup',
        out: {
          id: '001',
        },
      }
    })

    h0.add({
      if: {
        x: 4,
      },
      exec: () => ({
        op: 'merge',
        out: {
          qq: 2,
        },
      }),
    }).add({
      exec: () => ({
        op: 'stop',
        out: {
          last: 99,
        },
      }),
    })

    h0.add({
      exec: () => ({
        op: 'merge',
        out: {
          'should-never-be-reached': true,
        },
      }),
    })

    h0.add(() => { })

    let tI = ts

    assert.deepStrictEqual(
      Object.keys(h0.task).map(
        (tn) => tn + '~' + ('function' === typeof h0.task[tn].exec)
      ),
      [
        'A~true',
        'B~true',
        `task${++tI}~true`,
        `task${++tI}~true`,
        `task${++tI}~true`,
        'a~true',
        'b~true',
        'c~true',
        `task${++tI}~true`,
        `task${++tI}~true`,
        `task${++tI}~true`,
        `task${++tI}~true`,
      ]
    )

    h0.operator('lookup', (async (tr: any, ctx: any, data: any) => {
      if (ctx.err1) throw new Error('err1')

      return new Promise<any>((r) => {
        setTimeout(() => {
          data.y = tr.out
          r({ stop: false })
        }, 10)
      })
    }) as any)

    h0.operator(function does_nothing(tr: any, ctx: any, data: any) {
      return { stop: false }
    })

    assert.strictEqual(h0.tasks().length, 12)

    let out = await h0.exec()
    assert.deepStrictEqual(out.data, { x: 4, y: { id: '001' }, qq: 2, last: 99 })
    assert.strictEqual(out.taskcount, 8)
    assert.strictEqual(out.tasktotal, 12)

    tI = ts
    assert.deepStrictEqual(taskresult_log.map((te) => te.name + '~' + te.op), [
      'A~next',
      'B~skip',
      `task${++tI}~next`,
      `task${++tI}~merge`,
      `task${++tI}~skip`,
      'a~merge',
      'b~merge',
      'c~lookup',
      `task${++tI}~merge`,
      `task${++tI}~stop`,
    ])

    tI = ts
    assert.deepStrictEqual(
      taskend_log.map((te) => te.name + '~' + te.op + '~' + te.operate.stop),
      [
        'A~next~false',
        'B~skip~false',
        `task${++tI}~next~false`,
        `task${++tI}~merge~false`,
        `task${++tI}~skip~false`,
        'a~merge~false',
        'b~merge~false',
        'c~lookup~false',
        `task${++tI}~merge~false`,
        `task${++tI}~stop~true`,
      ]
    )

    out = await h0.exec({}, { z: 1, y: null }, {})
    assert.deepStrictEqual(out.data, { z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 })
    assert.strictEqual(out.taskcount, 8)
    assert.strictEqual(out.tasktotal, 12)

    out = await h0.exec({ err0: true }, { z: 2 }, {})
    assert.strictEqual(out.err!.message, 'err0')

    let operators = h0.operators()
    assert.deepStrictEqual(Object.keys(operators), [
      'next',
      'skip',
      'stop',
      'merge',
      'lookup',
      'does_nothing',
    ])

    tI = ts
    assert.deepStrictEqual(h0.tasks().map((t) => t.name), [
      'A',
      'B',
      `task${++tI}`,
      `task${++tI}`,
      `task${++tI}`,
      'a',
      'b',
      'c',
      `task${++tI}`,
      `task${++tI}`,
      `task${++tI}`,
      `task${++tI}`,
    ])

    out = await h0.exec({ err1: true }, {}, { runid: 'foo' })
    assert.strictEqual(out.err!.message, 'err1')

    out = await h0.exec({ err2: true }, {}, {
      done: function(rout: any) {
        assert.strictEqual(rout.err.message, 'Unknown operation: not-an-op')
      },
    })
    assert.strictEqual(out.err!.message, 'Unknown operation: not-an-op')
  })

  it('async', async () => {
    const h0 = new Ordu({ debug: true })
    const taskresult_log: any[] = []
    const taskend_log: any[] = []

    h0.on('task-result', (tr) => {
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev) => {
      taskend_log.push(ev)
    })

    function foo() {
      return { op: 'merge', out: { foo: 1 } }
    }

    function bar() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { bar: 1 } }), 10)
      )
    }

    // async function zed() {
    function zed() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { zed: 1 } }), 10)
      )
    }

    async function qaz_impl() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { qaz: 1 } }), 10)
      )
    }

    async function qaz() {
      return await qaz_impl()
    }

    async function ext0(x: string): Promise<string> {
      return new Promise((r) => setTimeout(() => r('ext0-' + x), 10))
    }

    function a_ext0() {
      const ext0p = ext0('a')
      return { op: 'merge', out: { ext0p: ext0p } }
    }

    async function b_ext0(spec: any) {
      const ext0r = await (spec.data as any).ext0p
      return { op: 'merge', out: { ext0r: ext0r } }
    }

    function ext1(x: string, cb: (err: any, result: string) => void) {
      setTimeout(() => cb(null, 'ext1-' + x), 10)
    }

    function a_ext1() {
      return new Promise((r) => {
        ext1('a', function(err, out) {
          r({ op: 'merge', out: { ext1r: out } })
        })
      })
    }

    h0.add({ name: 'foo', exec: foo, meta: {} })
    h0.add([bar, zed, { name: 'qaz', exec: qaz, meta: { from: 'second' } }])
    h0.add(a_ext0)
    h0.add(b_ext0)
    h0.add(a_ext1)

    let out = await h0.exec()
    assert.ok(out.err == null)

    const data: any = out.data
    assert.strictEqual(data.foo, 1)
    assert.strictEqual(data.bar, 1)
    assert.strictEqual(data.zed, 1)
    assert.strictEqual(data.qaz, 1)
    assert.strictEqual(data.ext0r, 'ext0-a')
    assert.strictEqual(data.ext1r, 'ext1-a')

    assert.ok(data.ext0p != null)
  })

  it('insert-order', async () => {
    const h0 = new Ordu()
    const names = (h0: any) =>
      h0
        .tasks()
        .map((t: any) => t.name)
        .join(' ')

    h0.add(function a() { })
    assert.strictEqual(names(h0), 'a')

    h0.add(function b() { })
    assert.strictEqual(names(h0), 'a b')

    h0.add(function c() { })
    assert.strictEqual(names(h0), 'a b c')

    h0.add(function A() { }, { before: 'a' })
    assert.strictEqual(names(h0), 'A a b c')

    h0.add(function B() { }, { before: 'b' })
    assert.strictEqual(names(h0), 'A a B b c')

    h0.add(function C() { }, { before: 'c' })
    assert.strictEqual(names(h0), 'A a B b C c')

    h0.add(function a0() { }, { after: 'a' })
    assert.strictEqual(names(h0), 'A a a0 B b C c')

    h0.add(function b0() { }, { after: 'b' })
    assert.strictEqual(names(h0), 'A a a0 B b b0 C c')

    h0.add(function c0() { }, { after: 'c' })
    assert.strictEqual(names(h0), 'A a a0 B b b0 C c c0')

    h0.add(function A0() { }, { before: 'a' })
    assert.strictEqual(names(h0), 'A A0 a a0 B b b0 C c c0')

    h0.add(function B0() { }, { before: 'b' })
    assert.strictEqual(names(h0), 'A A0 a a0 B B0 b b0 C c c0')

    h0.add(function C0() { }, { before: 'c' })
    assert.strictEqual(names(h0), 'A A0 a a0 B B0 b b0 C C0 c c0')

    h0.add(function a1() { }, { after: 'a' })
    assert.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b0 C C0 c c0')

    h0.add(function b1() { }, { after: 'b' })
    assert.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b1 b0 C C0 c c0')

    h0.add(function c1() { }, { after: 'c' })
    assert.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function A1() { }, { after: 'A' })
    assert.strictEqual(names(h0), 'A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function AA0() { }, { before: 'A' })
    assert.strictEqual(names(h0), 'AA0 A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')
  })

  it('errors', async () => {
    const h0 = new Ordu()

    h0.add(function a() {
      return {
        err: new Error('a-err'),
      }
    })

    let out = await h0.exec()
    assert.strictEqual(out.err!.message, 'a-err')

    let cbout: any
    await h0.exec(
      {},
      {},
      {
        done: function(rout: any) {
          cbout = rout
        },
      }
    )

    await new Promise<void>((r) =>
      setImmediate(() => {
        assert.strictEqual(cbout.err!.message, 'a-err')
        r()
      })
    )

    const h1 = new Ordu()

    h1.add(function a() {
      throw new Error('a-terr')
    })

    let h1out = await h1.exec()
    assert.strictEqual(h1out.err!.message, 'a-terr')

    let h1cbout: any
    await h1.exec(
      {},
      {},
      {
        done: function(rout: any) {
          h1cbout = rout
        },
      }
    )

    await new Promise<void>((r) =>
      setImmediate(() => {
        assert.strictEqual(h1cbout.err!.message, 'a-terr')
        r()
      })
    )
  })

  it('direct', async () => {
    const h0 = new Ordu()

    h0.add((spec: any) => {
      spec.data.foo.x = 1
    })

    h0.add((spec: any) => {
      spec.data.foo.y = 2
    })

    let foo: any = { z: 0 }
    let o0 = h0.execSync({}, { foo }, {})
    assert.deepStrictEqual(foo, { z: 0, x: 1, y: 2 })
    assert.deepStrictEqual((o0.data as any).foo, { z: 0, x: 1, y: 2 })
  })

  it('edges', async () => {
    const h0 = new Ordu()

    let o0 = h0.execSync()
    assert.deepStrictEqual(o0.tasklog, [])
    assert.strictEqual(o0.taskcount, 0)
    assert.strictEqual(o0.tasktotal, 0)

    let o1 = await h0.exec()
    assert.deepStrictEqual(o1.tasklog, [])
    assert.strictEqual(o1.taskcount, 0)
    assert.strictEqual(o1.tasktotal, 0)

    h0.operator('foo', (tr: any, ctx: any, data: any) => {
      throw new Error('foo')
    })
    h0.add(() => ({ op: 'foo' }))
    let o2 = h0.execSync()
    assert.strictEqual(o2.err!.message, 'foo')

    const h1 = new Ordu()
    h1.add(async () => {
      throw new Error('bar')
    })

    let o3 = await h1.exec()
    assert.strictEqual(o3.err!.message, 'bar')
  })

  it('readme', async () => {
    let process = new Ordu()

    process.add(function first(spec: any) {
      if (null == spec.data.foo) {
        return { op: 'stop', err: new Error('no foo') }
      }

      spec.data.foo = spec.data.foo.toUpperCase() + spec.ctx.suffix

      // Default is to continue to next step.
    })

    const ctx: any = { suffix: '!!!' }
    let data = { foo: 'green' }

    process.execSync(ctx, data, {})
    // DOC console.log(data.foo) // prints 'GREEN!!!' (first)
    assert.deepStrictEqual(data, { foo: 'GREEN!!!' })

    process.add(function second(spec: any) {
      spec.data.foo = spec.ctx.prefix + spec.data.foo
    })

    ctx.prefix = '>>>'
    data = { foo: 'blue' }
    process.execSync(ctx, data, {})
    // DOC console.log(data.foo) // prints '>>>BLUE!!!' (first, second)
    assert.deepStrictEqual(data, { foo: '>>>BLUE!!!' })
  })
})
