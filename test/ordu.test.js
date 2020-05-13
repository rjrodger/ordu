/* Copyright (c) 2016-2020 Richard Rodger, MIT License */
'use strict'

var { Ordu } = require('..')

var Lab = require('@hapi/lab')
var Code = require('@hapi/code')
var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var expect = Code.expect

describe('ordu', function() {
  it('sanity', async () => {
    var h0 = new Ordu()
    expect(h0).exists()
  })
  
  it('happy', async () => {
    var h0 = new Ordu()
    var taskresult_log = []
    var taskend_log = []

    h0.on('task-result', (tr)=>{
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev)=>{
      taskend_log.push(ev)
    })

    
    h0.add({
      name: 'a',
      from: 'my-ref-01'
    })

    h0.add({
      exec: (spec) => {
        if(spec.ctx.err0) {
          throw new Error('err0')
        }
        if(spec.ctx.err2) {
          return {op:'not-an-op'}
        }
        return null
      }
    })

    
    h0.add({
      id: '0',
      exec: () => ({
        op: 'merge',
        out: {
          x:2
        },
        why: 'some-reason'
      })
    })

    h0.add({
      if: {
        x: 4,
        xx: 40
      },
      exec: () => ({
        op: 'merge',
        out: {
          q: 1
        }
      })
    })

    
    h0.add({
      name: 'a',
      before: 'b',
      exec: async() => {
        return new Promise((r)=>setTimeout(()=>{r({
          op: 'merge'
          // out missing!
        })},10))
      }
    })

    h0.add(
      function b() {
        return {
          op: 'merge',
          out: {
            x:4
          }
        }
      },
      {
        after:['c'],
      }
    )

    h0.add(function c() {
      return {
        op: 'lookup',
        out: {
          id:'001'
        }
      }
    })

    
    h0.add({
      if: {
        'x': 4
      },
      exec: () => ({
        op: 'merge',
        out: {
          qq: 2
        }
      })
    })


    h0.add({
      exec: () => ({
        op: 'stop',
        out: {
          last: 99
        }
      })
    })


    h0.add({
      exec: () => ({
        op: 'merge',
        out: {
          'should-never-be-reached': true
        }
      })
    })


    h0.add(()=>{})


    
    h0.operator('lookup', async (tr, ctx, data) => {
      if(ctx.err1) throw new Error('err1')

      return new Promise((r)=>{
        setTimeout(()=>{
          data.y = tr.out
          r({stop:false})
        },10)
      })
    })


    h0.operator(function does_nothing(tr, ctx, data) {
      return {stop:false}
    })
    
    //console.log(h0.tasks())
    expect(h0.tasks().length).equal(11)
    
    var out = await h0.exec()
    expect(out.data).equal({ x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(11)
    //console.log(out.end-out.start)

    //console.dir(taskresult_log, {depth:null})
    //console.dir(taskend_log, {depth:null})
    expect(taskresult_log.length).equal(9)
    expect(taskend_log.length).equal(9)
    
    
    out = await h0.exec({},{z:1, y: null})
    expect(out.data).equal({ z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(11)

    
    out = await h0.exec({err0:true},{z:2})
    //console.log(out)
    expect(out.err.message).equal('err0')

    
    var operators = h0.operators()
    expect(Object.keys(operators)).equal([
      'next','skip','stop','merge','lookup', 'does_nothing'
    ])

    expect(h0.tasks().map(t=>t.name)).equals([
      'a',
      'task1',
      'task2',
      'task3',
      'a',
      'c',
      'b',
      'task9',
      'task10',
      'task11',
      'task12'
    ])
    

    out = await h0.exec({err1:true},null,{runid:'foo'})
    //console.log(out)
    expect(out.err.message).equal('err1')

    
    out = await h0.exec({err2:true},void 0,{done:(res)=>{
      expect(res.err.message).equal('Unknown operation: not-an-op')
    }})
    expect(out.err.message).equal('Unknown operation: not-an-op')

  })

  it('async', async ()=>{
    var h0 = new Ordu({debug:true})
    var taskresult_log = []
    var taskend_log = []

    h0.on('task-result', (tr)=>{
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev)=>{
      taskend_log.push(ev)
    })

    function foo() {
      return {op:'merge', out:{foo:1}}
    }

    function bar() {
      return new Promise(r=>setTimeout(()=>r({op:'merge', out:{bar:1}}),10))
    }

    async function zed() {
      return new Promise(r=>setTimeout(()=>r({op:'merge', out:{zed:1}}),10))
    }

    async function qaz_impl() {
      return new Promise(r=>setTimeout(()=>r({op:'merge', out:{qaz:1}}),10))
    }
    
    async function qaz() {
      return await qaz_impl()
    }


    async function ext0(x) {
      return new Promise(r=>setTimeout(()=>r('ext0-'+x),10))
    }
    
    function a_ext0() {
      var ext0p = ext0('a')
      return {op:'merge',out:{ext0p:ext0p}}
    }

    async function b_ext0(spec) {
      var ext0r = await spec.data.ext0p
      return {op:'merge',out:{ext0r:ext0r}}
    }


    function ext1(x, cb) {
      setTimeout(()=>cb(null,'ext1-'+x),10)
    }

    function a_ext1() {
      return new Promise(r=>{
        ext1('a', function(err, out) {
          r({op:'merge',out:{ext1r:out}})
        })
      })
    }
    
    h0.add({name:'foo', exec:foo})
    h0.add([bar,zed,{name:'qaz',exec:qaz}])
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
      ext1r: 'ext1-a'
    })

    expect(out.data.ext0p).exists()


    
    //console.dir(taskresult_log, {depth:null})
    //console.dir(taskend_log, {depth:null})

  })
})
