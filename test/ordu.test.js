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
  it('happy', async () => {


    var h0 = new Ordu()
    expect(h0).exists()

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
        }
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

    h0.add({
      name:'b',
      after:['c'],
      exec: () => ({
        op: 'merge',
        out: {
          x:4
        }
      })
    })

    h0.add({
      name:'c',
      exec: () => ({
        op: 'lookup',
        out: {
          id:'001'
        }
      })
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

    
    h0.operator('lookup', async (tr, ctx, data) => {
      if(ctx.err1) throw new Error('err1')

      return new Promise((r)=>{
        setTimeout(()=>{
          data.y = tr.out
          r({stop:false})
        },10)
      })
    })
    
    //console.log(h0.tasks())
    expect(h0.tasks().length).equal(8)
    
    var out = await h0.exec()
    expect(out.data).equal({ x: 4, y: { id: '001' }, qq: 2 })
    expect(out.task_count).equal(7)
    expect(out.task_total).equal(8)
    //console.log(out.end-out.start)

    out = await h0.exec({},{z:1})
    expect(out.data).equal({ z: 1, x: 4, y: { id: '001' }, qq: 2 })
    expect(out.task_count).equal(7)
    expect(out.task_total).equal(8)

    out = await h0.exec({err0:true},{z:2})
    //console.log(out)
    expect(out.err.message).equal('err0')

    
    var operators = h0.operators()
    expect(Object.keys(operators)).equal([
      'next','skip','stop','merge','lookup'
    ])


    out = await h0.exec({err1:true})
    //console.log(out)
    expect(out.err.message).equal('err1')

    
    out = await h0.exec({err2:true})
    expect(out.err.message).equal('Unknown operation: not-an-op')

  })
})
