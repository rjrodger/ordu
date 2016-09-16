/* Copyright (c) 2016 Richard Rodger and other contributors, MIT License */
'use strict'


var Assert = require('assert')


module.exports = function (opts) {
  return new Ordu(opts)
}


var orduI = -1


function Ordu (opts) {
  var self = this
  ++orduI


  opts = opts || {}
  Assert('object' === typeof opts)

  opts.name = opts.name || 'ordu' + orduI


  self.add = api_add
  self.process = api_process
  self.tasknames = api_tasknames
  self.toString = api_toString


  var tasks = []


  function api_add (task) {
    Assert('function' === typeof task)

    if (!task.name) {
      Object.defineProperty(task, 'name', {
        value: opts.name + '_task' + tasks.length
      })
    }

    tasks.push(task)
  }


  function api_process (ctxt, data) {
    for (var tI = 0; tI < tasks.length; ++tI) {
      var index$ = tI
      var taskname$ = tasks[tI].name

      ctxt.index$ = index$
      ctxt.taskname$ = taskname$

      var res = tasks[tI].call(null, ctxt, data)

      if (res) {
        res.index$ = index$
        res.taskname$ = taskname$
        res.ctxt$ = ctxt
        res.data$ = data
        return res
      }
    }
  }


  function api_tasknames () {
    return tasks.map(function (v) {
      return v.name
    })
  }


  function api_toString () {
    return opts.name + ':[' + self.tasknames() + ']'
  }

  return self
}
