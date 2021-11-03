/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
'use strict'

var { Ordu } = require('..')

var Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

var Code = require('@hapi/code')
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('ordu', function () {
  it('sanity', async () => {
    var h0 = new Ordu()
    expect(h0).exists()
  })

  it('happy', async () => {
    var h0 = new Ordu()

    h0.add((spec)=>({
      op: 'merge',
      out: {
        y: spec.data.x*10,
      },
    }))

    let o0 = await h0.exec({},{x:11})
    expect(o0.data).equals({x:11, y:110})

    let o1 = await h0.exec({},{x:22})
    expect(o1.data).equals({x:22, y:220})


    h0.add((spec)=>({
      op: 'merge',
      out: {
        z: spec.data.y/100,
      },
    }))

    let o2 = await h0.exec({},{x:33})
    expect(o2.data).equals({x:33, y:330, z:3.3})
    
  })
  
  it('basic', async () => {
    var h0 = new Ordu()
    var taskresult_log = []
    var taskend_log = []

    h0.on('task-result', (tr) => {
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev) => {
      taskend_log.push(ev)
    })

    h0.add({
      name: 'A',
      from: 'my-ref-01',
      meta: {
        from: { foo: 1 },
      },
    })

    h0.add({
      name: 'B',
      active: false,
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

    expect(
      Object.keys(h0.task).map(
        (tn) => tn + '~' + ('function' === typeof h0.task[tn].exec)
      )
    ).equal([
      'A~true',
      'B~true',
      'task0~true',
      'task1~true',
      'task2~true',
      'a~true',
      'b~true',
      'c~true',
      'task3~true',
      'task4~true',
      'task5~true',
      'task6~true',
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

    //console.log(h0.tasks())
    expect(h0.tasks().length).equal(12)

    var out = await h0.exec()
    expect(out.data).equal({ x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(12)
    //console.log(out.end-out.start)

    //console.dir(taskresult_log, {depth:null})
    //console.dir(taskend_log, {depth:null})
    expect(taskresult_log.map((te) => te.name + '~' + te.op)).equal([
      'A~next',
      'B~skip',
      'task0~next',
      'task1~merge',
      'task2~skip',
      'a~merge',
      'b~merge',
      'c~lookup',
      'task3~merge',
      'task4~stop',
    ])
    expect(
      taskend_log.map((te) => te.name + '~' + te.op + '~' + te.operate.stop)
    ).equal([
      'A~next~false',
      'B~skip~false',
      'task0~next~false',
      'task1~merge~false',
      'task2~skip~false',
      'a~merge~false',
      'b~merge~false',
      'c~lookup~false',
      'task3~merge~false',
      'task4~stop~true',
    ])

    out = await h0.exec({}, { z: 1, y: null })
    expect(out.data).equal({ z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(12)

    out = await h0.exec({ err0: true }, { z: 2 })
    //console.log(out)
    expect(out.err.message).equal('err0')

    var operators = h0.operators()
    expect(Object.keys(operators)).equal([
      'next',
      'skip',
      'stop',
      'merge',
      'lookup',
      'does_nothing',
    ])

    expect(h0.tasks().map((t) => t.name)).equals([
      'A',
      'B',
      'task0',
      'task1',
      'task2',
      'a',
      'b',
      'c',
      'task3',
      'task4',
      'task5',
      'task6',
    ])

    out = await h0.exec({ err1: true }, null, { runid: 'foo' })
    //console.log(out)
    expect(out.err.message).equal('err1')

    out = await h0.exec({ err2: true }, void 0, {
      done: (res) => {
        expect(res.err.message).equal('Unknown operation: not-an-op')
      },
    })
    expect(out.err.message).equal('Unknown operation: not-an-op')
  })

  it('async', async () => {
    var h0 = new Ordu({ debug: true })
    var taskresult_log = []
    var taskend_log = []

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
      var ext0p = ext0('a')
      return { op: 'merge', out: { ext0p: ext0p } }
    }

    async function b_ext0(spec) {
      var ext0r = await spec.data.ext0p
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

    h0.add({ name: 'foo', exec: foo })
    h0.add([bar, zed, { name: 'qaz', exec: qaz }])
    h0.add(a_ext0)
    h0.add(b_ext0)
    h0.add(a_ext1)

    var out = await h0.exec()
    //console.dir(out,{depth:null})
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

    //console.dir(taskresult_log, {depth:null})
    //console.dir(taskend_log, {depth:null})
  })

  it('insert-order', async () => {
    var h0 = new Ordu()
    var names = (h0) =>
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

    //console.log(names(h0))
  })

  
  it('errors', async () => {
    var h0 = new Ordu()

    h0.add(function a() {
      return {
        err: new Error('a-err'),
      }
    })

    var out = await h0.exec()
    expect(out.err.message).equals('a-err')

    var cbout
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

    var h1 = new Ordu()

    h1.add(function a() {
      throw new Error('a-terr')
    })

    var h1out = await h1.exec()
    expect(h1out.err.message).equals('a-terr')

    var h1cbout
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
})
