/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
'use strict'

const { Ordu, Task } = require('..')

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

describe('ordu', function () {
  it('sanity', async () => {
    const h0 = new Ordu()
    expect(h0).exists()
  })

  it('happy', async () => {
    const h0 = new Ordu()

    h0.add((spec) => ({
      op: 'merge',
      out: {
        y: spec.data.x * 10,
      },
    }))

    let o0 = await h0.exec({}, { x: 11 })
    expect(o0.data).equals({ x: 11, y: 110 })

    let o1 = await h0.exec({}, { x: 22 })
    expect(o1.data).equals({ x: 22, y: 220 })

    h0.add((spec) => ({
      op: 'merge',
      out: {
        z: spec.data.y / 100,
      },
    }))

    let o2 = await h0.exec({}, { x: 33 })
    expect(o2.data).equals({ x: 33, y: 330, z: 3.3 })

    // let o3 = h0.execSync({},{x:33})
    // expect(o3.data).equals({x:33, y:330, z:3.3})
  })

  it('basic', async () => {
    let ts = Task.count - 1

    const h0 = new Ordu()
    const taskresult_log = []
    const taskend_log = []

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
      exec: (spec) => {
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

    h0.add(() => {})

    let tI = ts

    expect(
      Object.keys(h0.task).map(
        (tn) => tn + '~' + ('function' === typeof h0.task[tn].exec)
      )
    ).equal([
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
    ])

    h0.operator('lookup', async (tr, ctx, data) => {
      if (ctx.err1) throw new Error('err1')

      return new Promise((r) => {
        setTimeout(() => {
          data.y = tr.out
          r({ stop: false })
        }, 10)
      })
    })

    h0.operator(function does_nothing(tr, ctx, data) {
      return { stop: false }
    })

    expect(h0.tasks().length).equal(12)

    let out = await h0.exec()
    expect(out.data).equal({ x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.taskcount).equal(8)
    expect(out.tasktotal).equal(12)

    tI = ts
    expect(taskresult_log.map((te) => te.name + '~' + te.op)).equal([
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
    expect(
      taskend_log.map((te) => te.name + '~' + te.op + '~' + te.operate.stop)
    ).equal([
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
    ])

    out = await h0.exec({}, { z: 1, y: null })
    expect(out.data).equal({ z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.taskcount).equal(8)
    expect(out.tasktotal).equal(12)

    out = await h0.exec({ err0: true }, { z: 2 })
    expect(out.err.message).equal('err0')

    let operators = h0.operators()
    expect(Object.keys(operators)).equal([
      'next',
      'skip',
      'stop',
      'merge',
      'lookup',
      'does_nothing',
    ])

    tI = ts
    expect(h0.tasks().map((t) => t.name)).equals([
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

    out = await h0.exec({ err1: true }, null, { runid: 'foo' })
    expect(out.err.message).equal('err1')

    out = await h0.exec({ err2: true }, void 0, {
      done: (res) => {
        expect(res.err.message).equal('Unknown operation: not-an-op')
      },
    })
    expect(out.err.message).equal('Unknown operation: not-an-op')
  })

  it('async', async () => {
    const h0 = new Ordu({ debug: true })
    const taskresult_log = []
    const taskend_log = []

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

    async function ext0(x) {
      return new Promise((r) => setTimeout(() => r('ext0-' + x), 10))
    }

    function a_ext0() {
      const ext0p = ext0('a')
      return { op: 'merge', out: { ext0p: ext0p } }
    }

    async function b_ext0(spec) {
      const ext0r = await spec.data.ext0p
      return { op: 'merge', out: { ext0r: ext0r } }
    }

    function ext1(x, cb) {
      setTimeout(() => cb(null, 'ext1-' + x), 10)
    }

    function a_ext1() {
      return new Promise((r) => {
        ext1('a', function (err, out) {
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
    expect(out.err).not.exists()

    expect(out.data).includes({
      foo: 1,
      bar: 1,
      zed: 1,
      qaz: 1,
      ext0r: 'ext0-a',
      ext1r: 'ext1-a',
    })

    expect(out.data.ext0p).exists()
  })

  it('insert-order', async () => {
    const h0 = new Ordu()
    const names = (h0) =>
      h0
        .tasks()
        .map((t) => t.name)
        .join(' ')

    h0.add(function a() {})
    expect(names(h0)).equal('a')

    h0.add(function b() {})
    expect(names(h0)).equal('a b')

    h0.add(function c() {})
    expect(names(h0)).equal('a b c')

    h0.add(function A() {}, { before: 'a' })
    expect(names(h0)).equal('A a b c')

    h0.add(function B() {}, { before: 'b' })
    expect(names(h0)).equal('A a B b c')

    h0.add(function C() {}, { before: 'c' })
    expect(names(h0)).equal('A a B b C c')

    h0.add(function a0() {}, { after: 'a' })
    expect(names(h0)).equal('A a a0 B b C c')

    h0.add(function b0() {}, { after: 'b' })
    expect(names(h0)).equal('A a a0 B b b0 C c')

    h0.add(function c0() {}, { after: 'c' })
    expect(names(h0)).equal('A a a0 B b b0 C c c0')

    h0.add(function A0() {}, { before: 'a' })
    expect(names(h0)).equal('A A0 a a0 B b b0 C c c0')

    h0.add(function B0() {}, { before: 'b' })
    expect(names(h0)).equal('A A0 a a0 B B0 b b0 C c c0')

    h0.add(function C0() {}, { before: 'c' })
    expect(names(h0)).equal('A A0 a a0 B B0 b b0 C C0 c c0')

    h0.add(function a1() {}, { after: 'a' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b0 C C0 c c0')

    h0.add(function b1() {}, { after: 'b' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b1 b0 C C0 c c0')

    h0.add(function c1() {}, { after: 'c' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function A1() {}, { after: 'A' })
    expect(names(h0)).equal('A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function AA0() {}, { before: 'A' })
    expect(names(h0)).equal('AA0 A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')
  })

  it('errors', async () => {
    const h0 = new Ordu()

    h0.add(function a() {
      return {
        err: new Error('a-err'),
      }
    })

    let out = await h0.exec()
    expect(out.err.message).equals('a-err')

    let cbout
    await h0.exec(
      {},
      {},
      {
        done: function (rout) {
          cbout = rout
        },
      }
    )

    await new Promise((r) =>
      setImmediate(() => {
        expect(cbout.err.message).equals('a-err')
        r()
      })
    )

    const h1 = new Ordu()

    h1.add(function a() {
      throw new Error('a-terr')
    })

    let h1out = await h1.exec()
    expect(h1out.err.message).equals('a-terr')

    let h1cbout
    await h1.exec(
      {},
      {},
      {
        done: function (rout) {
          h1cbout = rout
        },
      }
    )

    await new Promise((r) =>
      setImmediate(() => {
        expect(h1cbout.err.message).equals('a-terr')
        r()
      })
    )
  })

  it('direct', async () => {
    const h0 = new Ordu()

    h0.add((spec) => {
      spec.data.foo.x = 1
    })

    h0.add((spec) => {
      spec.data.foo.y = 2
    })

    let foo = { z: 0 }
    let o0 = h0.execSync({}, { foo })
    expect(foo).equals({ z: 0, x: 1, y: 2 })
    expect(o0.data.foo).equals({ z: 0, x: 1, y: 2 })
  })

  it('edges', async () => {
    const h0 = new Ordu()

    let o0 = h0.execSync()
    expect(o0.tasklog).equal([])
    expect(o0.taskcount).equal(0)
    expect(o0.tasktotal).equal(0)

    let o1 = await h0.exec()
    expect(o1.tasklog).equal([])
    expect(o1.taskcount).equal(0)
    expect(o1.tasktotal).equal(0)

    h0.operator('foo', (tr, ctx, data) => {
      throw new Error('foo')
    })
    h0.add(() => ({ op: 'foo' }))
    let o2 = h0.execSync()
    expect(o2.err.message).equals('foo')

    const h1 = new Ordu()
    h1.add(async () => {
      throw new Error('bar')
    })

    let o3 = await h1.exec()
    expect(o3.err.message).equals('bar')
  })

  it('readme', async () => {
    let process = new Ordu()

    process.add(function first(spec) {
      if (null == spec.data.foo) {
        return { op: 'stop', err: new Error('no foo') }
      }

      spec.data.foo = spec.data.foo.toUpperCase() + spec.ctx.suffix

      // Default is to continue to next step.
    })

    const ctx = { suffix: '!!!' }
    let data = { foo: 'green' }

    process.execSync(ctx, data)
    // DOC console.log(data.foo) // prints 'GREEN!!!' (first)
    expect(data).equals({ foo: 'GREEN!!!' })

    process.add(function second(spec) {
      spec.data.foo = spec.ctx.prefix + spec.data.foo
    })

    ctx.prefix = '>>>'
    data = { foo: 'blue' }
    process.execSync(ctx, data)
    // DOC console.log(data.foo) // prints '>>>BLUE!!!' (first, second)
    expect(data).equals({ foo: '>>>BLUE!!!' })
  })
})
