/* Copyright (c) 2016-2021 Richard Rodger and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict'
/* $lab:coverage:on$ */

import { EventEmitter } from 'events'

import * as Hoek from '@hapi/hoek'

import Nua from 'nua'
import StrictEventEmitter from 'strict-event-emitter-types'

export type { TaskDef, TaskSpec }

export { Ordu, Task, LegacyOrdu }

interface Events {
  'task-result': TaskResult
  'task-end': { result: TaskResult; operate: Operate; data: any }
}

type OrduEmitter = StrictEventEmitter<EventEmitter, Events>

interface OrduIF {
  add(td: TaskDef): OrduIF
  add(td: TaskDef[]): OrduIF

  add(te: TaskExec): OrduIF
  add(te: TaskExec, td: TaskDef): OrduIF
  add(te: TaskExec[]): OrduIF

  tasks(): Task[]

  task: {
    [name: string]: Task
  }

  operator(name: string, opr: Operator): void
  operator(opr: Operator): void

  operators(): object

  execSync(this: Ordu, ctx: any, data: any, opts: any): ExecResult
  exec(ctx: any, data: any, opts: any): Promise<ExecResult>
}

interface TaskDef {
  id?: string
  name?: string
  before?: string
  after?: string
  exec?: TaskExec
  // from?: object
  if?: { [k: string]: any }
  active?: boolean
  meta?: any
}

type TaskExec = (s: TaskSpec) => any

interface TaskSpec {
  ctx: any
  data: any
  task: Task
}

class Task {
  static count: number = 0

  runid: string
  name: string
  before?: string
  after?: string
  exec: (s: TaskSpec) => TaskResult
  if?: { [k: string]: any }
  active?: boolean
  meta: {
    when: number
    from: object
  }

  constructor(taskdef: TaskDef) {
    this.runid =
      null == taskdef.id ? ('' + Math.random()).substring(2) : taskdef.id
    this.name = taskdef.name || 'task' + Task.count++
    this.before = taskdef.before
    this.after = taskdef.after
    this.exec = taskdef.exec || ((_: TaskSpec) => {})
    this.if = taskdef.if || void 0
    this.active = null == taskdef.active ? true : taskdef.active
    this.meta = Object.assign(taskdef.meta || {}, {
      when: Date.now(),
      from: taskdef.meta?.from,
    })
  }
}

// Use the constructor to normalize task result
class TaskResult {
  op: string
  out?: object
  err?: Error
  why?: string
  task: Task
  name: string
  start: number
  end: number
  runid: string
  index: number
  total: number
  async: boolean

  constructor(task: Task, taskI: number, total: number, runid: string) {
    this.op = 'not-defined'
    this.task = task
    this.name = task.name
    this.start = Date.now()
    this.end = Number.MAX_SAFE_INTEGER
    this.index = taskI
    this.total = total
    this.async = false
    this.runid = runid
  }

  update(raw: any) {
    raw = null == raw ? {} : raw

    this.out = null == raw.out ? {} : raw.out
    this.err = raw instanceof Error ? raw : raw.err

    this.op =
      null != this.err ? 'stop' : 'string' === typeof raw.op ? raw.op : 'next'

    this.why = raw.why || ''
  }
}

type Operate = {
  stop: boolean
  err?: Error
  async?: boolean
}

type ExecResult = {
  tasklog: any[]
  task?: Task
  taskcount: number
  tasktotal: number
  start: number
  end: number
  err?: Error
  data: object
}

type Operator = (r: TaskResult, ctx: any, data: object) => Operate

class Ordu extends (EventEmitter as { new (): OrduEmitter }) implements OrduIF {
  private _opts: any

  private _tasks: Task[]

  private _operator_map: {
    [op: string]: Operator
  }

  task: { [name: string]: Task }

  constructor(opts?: any) {
    super()

    this.task = {}

    this._opts = {
      debug: false,
      ...opts,
    }

    this._tasks = []

    this._operator_map = {
      next: () => ({ stop: false }),

      skip: () => ({ stop: false }),

      stop: (tr, _, data) => {
        Nua(data, tr.out, { preserve: true })
        return { stop: true, err: tr.err }
      },

      merge: (tr, _, data) => {
        Nua(data, tr.out, { preserve: true })
        return { stop: false }
      },
    }
  }

  operator(first: string | Operator, opr?: Operator) {
    let name: string = 'string' === typeof first ? first : first.name
    this._operator_map[name] = opr || (first as Operator)
  }

  operators() {
    return this._operator_map
  }

  add(first: any, second?: any): Ordu {
    let callpoint: string[] | undefined
    if (this._opts.debug) {
      callpoint = make_callpoint(new Error())
    }

    if ('function' == typeof first) {
      second = second || {}
      let t = second
      t.exec = first
      t.name = first.name ? first.name : t.name
      this._add_task(t, callpoint)
    } else if (Array.isArray(first)) {
      for (var i = 0; i < first.length; i++) {
        let entry: TaskDef = first[i]
        if ('function' === typeof first[i]) {
          entry = { name: (first[i] as TaskExec).name, exec: first[i] }
        }
        this._add_task(entry, callpoint)
      }
    } else {
      this._add_task(first, callpoint)
    }

    return this
  }

  private _add_task(td: TaskDef, callpoint: string[] | undefined): void {
    if (callpoint) {
      td.meta = td.meta || {}
      td.meta.from = Object.assign(td.meta.from || {}, {
        callpoint$: callpoint,
      })
    }

    let t = new Task(td)

    let tI = 0
    for (; tI < this._tasks.length; tI++) {
      if (null != t.before && this._tasks[tI].name === t.before) {
        break
      } else if (null != t.after && this._tasks[tI].name === t.after) {
        tI++
        break
      }
    }

    this._tasks.splice(tI, 0, t)

    this.task[t.name] = t
  }

  execSync(this: Ordu, ctx: any, data: any, opts: any): ExecResult {
    return this._execImpl(ctx, data, opts) as unknown as ExecResult
  }

  async exec(ctx: any, data: any, opts: any): Promise<ExecResult> {
    return new Promise((resolve) => {
      this._execImpl(ctx, data, opts, resolve)
    })
  }

  _execImpl(
    this: Ordu,
    ctx: any,
    data: any,
    opts: any,
    resolve?: (execres: ExecResult) => void
  ): ExecResult | Promise<ExecResult> {
    const self = this

    opts = null == opts ? {} : opts
    let runid = opts.runid || (Math.random() + '').substring(2)
    let start = Date.now()
    let tasks: Task[] = [...self._tasks]

    let spec = {
      ctx: ctx || {},
      data: data || {},
    }

    let tasklog: any[] = []

    let taskcount = 0

    let last_taskI = 0
    let last_operate: any = undefined

    return next(0) as ExecResult

    function next(taskI: number): ExecResult | void {
      if (taskI >= tasks.length) {
        let execres = finish()
        return resolve ? resolve(execres) : execres
      }
      last_taskI = taskI

      let task = tasks[taskI]
      let execres: any
      let taskout: any
      let result = new TaskResult(task, taskI, tasks.length, runid)

      if (task.active && self._task_if(task, spec.data)) {
        try {
          taskcount++
          let taskspec = Object.assign({ task: task }, spec)
          execres = task.exec(taskspec)

          if (execres instanceof Promise) {
            result.async = true
            execres
              .then((out) => (taskout = out))
              .catch((err) => (taskout = err))
              .finally(() => handle_result(taskI, task, taskout, result))
          } else {
            taskout = execres
          }
        } catch (task_ex) {
          taskout = task_ex
        }
      } else {
        taskout = { op: 'skip' }
      }

      if (!result.async) {
        return handle_result(taskI, task, taskout, result)
      }
    }

    function handle_result(
      taskI: number,
      task: Task,
      taskout: any,
      result: TaskResult
    ): ExecResult | void {
      result.end = Date.now()
      result.update(taskout)
      self.emit('task-result', result)

      let operate: Operate = {
        stop: false,
        err: undefined,
        async: false,
      }

      try {
        let opres = self._operate(result, spec.ctx, spec.data)
        if (opres instanceof Promise) {
          operate.async = true
          opres
            .then((out) => {
              Object.assign(operate, out)
            })
            .catch((err) => {
              operate.stop = true
              operate.err = err
            })
            .finally(() => {
              handle_operate(taskI, task, result, operate)
            })
        } else {
          operate = opres as Operate
          operate.async = false
        }
      } catch (operate_ex) {
        operate.stop = true
        operate.err = operate_ex as Error
      }

      if (!operate.async) {
        return handle_operate(taskI, task, result, operate)
      }
    }

    function handle_operate(
      taskI: number,
      task: Task,
      result: TaskResult,
      operate: Operate
    ): ExecResult | void {
      last_operate = operate

      let entry = {
        name: task.name,
        op: result.op,
        task,
        result,
        operate,
        data: self._opts.debug ? JSON.parse(JSON.stringify(spec.data)) : void 0,
      }
      tasklog.push(entry)
      self.emit('task-end', entry)

      if (!operate.stop) {
        ++taskI
      } else {
        taskI = tasks.length
      }

      return next(taskI)
    }

    function finish(): ExecResult {
      let err = last_operate ? last_operate.err : null

      let execres: ExecResult = {
        tasklog: tasklog,
        task: err ? tasks[last_taskI] : void 0,
        taskcount: taskcount,
        tasktotal: tasks.length,
        start: start,
        end: Date.now(),
        err: err,
        data: spec.data,
      }

      if (opts.done) {
        opts.done(execres)
      }

      return execres
    }
  }

  tasks() {
    return [...this._tasks]
  }

  private _operate(r: TaskResult, ctx: any, data: object): Operate {
    if (r.err) {
      return {
        stop: true,
        err: r.err,
        async: false,
      }
    }

    let operator = this._operator_map[r.op]

    if (operator) {
      return operator(r, ctx, data)
    } else {
      return {
        stop: true,
        err: new Error('Unknown operation: ' + r.op),
        async: false,
      }
    }
  }

  private _task_if(task: Task, data: object): boolean {
    if (task.if) {
      let task_if: { [k: string]: any } = task.if
      return Object.keys(task_if).reduce((proceed: boolean, k: string) => {
        let part: any = Hoek.reach(data, k)

        return (
          proceed &&
          Hoek.contain({ $: part }, { $: task_if[k] }, { deep: true })
        )
      }, true)
    } else {
      return true
    }
  }
}

/* $lab:coverage:off$ */
function make_callpoint(err: Error) {
  return null == err
    ? []
    : (err.stack || '')
        .split(/\n/)
        .slice(4)
        .map((line) => line.substring(4))
}
/* $lab:coverage:on$ */

function LegacyOrdu(opts?: any): any {
  var orduI = -1

  var self: any = {}
  ++orduI

  opts = opts || {}
  opts.name = opts.name || 'ordu' + orduI

  self.add = api_add
  self.process = api_process
  self.tasknames = api_tasknames
  self.taskdetails = api_taskdetails
  self.toString = api_toString

  var tasks: any[] = []

  function api_add(spec: any, task: any) {
    task = task || spec

    if (!task.name) {
      Object.defineProperty(task, 'name', {
        value: opts.name + '_task' + tasks.length,
      })
    }

    task.tags = spec.tags || []

    tasks.push(task)

    return self
  }

  // Valid calls:
  //   * process(spec, ctxt, data)
  //   * process(ctxt, data)
  //   * process(data)
  //   * process()
  function api_process() {
    var i = arguments.length
    var data = 0 < i && arguments[--i]
    var ctxt = 0 < i && arguments[--i]
    var spec = 0 < i && arguments[--i]

    data = data || {}
    ctxt = ctxt || {}
    spec = spec || {}

    spec.tags = spec.tags || []

    for (var tI = 0; tI < tasks.length; ++tI) {
      var task = tasks[tI]

      if (0 < spec.tags.length && !contains(task.tags, spec.tags)) {
        continue
      }

      var index$ = tI
      var taskname$ = task.name

      ctxt.index$ = index$
      ctxt.taskname$ = taskname$

      var res = task(ctxt, data)

      if (res) {
        res.index$ = index$
        res.taskname$ = taskname$
        res.ctxt$ = ctxt
        res.data$ = data
        return res
      }
    }

    return null
  }

  function api_tasknames() {
    return tasks.map(function (v) {
      return v.name
    })
  }

  function api_taskdetails() {
    return tasks.map(function (v) {
      return v.name + ':{tags:' + v.tags + '}'
    })
  }

  function api_toString() {
    return opts.name + ':[' + self.tasknames() + ']'
  }

  return self
}

function contains(all: any, some: any) {
  for (var i = 0; i < some.length; ++i) {
    if (-1 === all.indexOf(some[i])) {
      return false
    }
  }

  return true
}
