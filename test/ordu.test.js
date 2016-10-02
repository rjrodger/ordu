/* Copyright (c) 2016 Richard Rodger, MIT License */
'use strict'

var Lab = require('lab')
var Code = require('code')
var Ordu = require('../')


var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect


describe('ordu', function () {
  it('construct', function (fin) {
    var w = Ordu()
    expect(w).to.exist()

    var wn = ('' + w).replace(/ordu\d+/g, 'ordu0')
    expect(wn).to.equal('ordu0:[]')
    fin()
  })

  it('happy', function (fin) {
    var w = Ordu()

    w.add(function (ctxt, data) {
      data.x = 1
    })

    var ctxt = {}
    var data = {}

    expect(data.x).to.not.exist()

    var res = w.process(ctxt, data)

    expect(res).to.not.exist()
    expect(data.x).to.equal(1)

    w.add(function failer (ctxt, data) {
      return {kind: 'error'}
    })

    data = {}
    res = w.process(ctxt, data)

    expect(data.x).to.equal(1)
    expect(res.kind).to.equal('error')
    expect(res.index$).to.equal(1)
    expect(res.taskname$).to.equal('failer')
    expect(res.ctxt$).to.equal(ctxt)
    expect(res.data$).to.equal(data)

    var wn = ('' + w).replace(/ordu\d+/g, 'ordu1')
    expect(wn).to.equal('ordu1:[ordu1_task0,failer]')

    fin()
  })


  it('list', function (fin) {
    var w = Ordu({name: 'foo'})

    w.add(function zero () {})
    w.add(function () {})
    w.add(function two () {})

    expect(w.tasknames()).to.equal(['zero', 'foo_task1', 'two'])
    expect(w.taskdetails()).to.equal(['zero:{tags:}',
                                      'foo_task1:{tags:}',
                                      'two:{tags:}'])
    expect('' + w).to.equal('foo:[zero,foo_task1,two]')
    fin()
  })


  it('process', function (fin) {
    var w = Ordu({name: 'tags'})

    w.add(function zero (c, d) {
      d.zero = true
    })

    var data = {}
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

    fin()
  })


  it('tags', function (fin) {
    var w = Ordu({name: 'tags'})

    w.add({tags: ['red']}, function zero (c, d) {
      d.push('zero')
    })

    w.add({tags: []}, function one (c, d) {
      d.push('one')
    })

    w.add(function two (c, d) {
      d.push('two')
    })

    var data = []
    expect(w.process({}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'one', 'two'])

    data = []
    expect(w.process({tags: ['red']}, {}, data)).to.equal(null)
    expect(data).to.equal(['zero'])

    w.add({tags: ['red', 'blue']}, function three (c, d) {
      d.push('three')
    })

    data = []
    expect(w.process({tags: ['blue', 'red']}, {}, data)).to.equal(null)
    expect(data).to.equal(['three'])

    data = []
    expect(w.process({tags: ['red']}, {}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'three'])

    data = []
    expect(w.process({tags: ['blue']}, {}, data)).to.equal(null)
    expect(data).to.equal(['three'])

    data = []
    expect(w.process({tags: []}, {}, data)).to.equal(null)
    expect(data).to.equal(['zero', 'one', 'two', 'three'])

    fin()
  })
})
