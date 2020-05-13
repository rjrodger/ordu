/* Copyright (c) 2016-2020 Richard Rodger and other contributors, MIT License */
'use strict'

import * as Hoek from '@hapi/hoek'
import * as Topo from '@hapi/topo'

import Nua from 'nua'

export { Ordu, LegacyOrdu }

interface OrduIF {
  add(td: TaskDef): void
  add(td: TaskDef[]): void

  add(te: TaskExec): void
  add(te: TaskExec, td: TaskDef): void
  add(te: TaskExec[]): void

  tasks(): Task[]

  operator(name: string, opr: Operator): void
  operator(opr: Operator): void

  operators(): object
  exec(ctx: any, data: any, opts: any): Promise<ExecResult>
}

interface TaskDef {
  id?: string
  name?: string
  before?: string | string[]
  after?: string | string[]
  exec?: TaskExec
  from?: object
  if?: { [k: string]: any }
}

type TaskExec = (s: Spec) => any

interface Spec {
  ctx: object
  data: object
}

class Task {
  static count: number = 0

  id: string
  name: string
  before: string[]
  after: string[]
  exec: (s: Spec) => TaskResult
  if?: { [k: string]: any }
  meta: {
    order: number
    when: number
    from: object
  }

  constructor(taskdef: TaskDef) {
    this.id =
      null == taskdef.id ? ('' + Math.random()).substring(2) : taskdef.id
    this.name = taskdef.name || 'task' + Task.count
    this.before = strarr(taskdef.before)
    this.after = strarr(taskdef.after)
    this.exec = taskdef.exec || ((_: Spec) => {})
    this.if = taskdef.if || void 0
    this.meta = {
      order: Task.count++,
      when: Date.now(),

      // TODO: auto generate call point stacktrace?
      from: taskdef.from || {},
    }
  }
}

type TaskLogEntry = {
  task: Task
  start: number
  end: number
}

// Use the constructor to normalize task result
class TaskResult {
  op: string
  out: object
  err?: Error
  log: TaskLogEntry
  why: string

  constructor(log: TaskLogEntry, raw: any) {
    raw = null == raw ? {} : raw

    this.log = log
    this.out = null == raw.out ? {} : raw.out
    this.err = raw instanceof Error ? raw : void 0

    this.op =
      null != this.err ? 'stop' : 'string' === typeof raw.op ? raw.op : 'next'

    this.why = raw.why || ''
  }
}

type Operate = {
  stop: boolean
  err?: Error
}

type ExecResult = {
  tasklog: any[]
  task?: Task
  task_count: number
  task_total: number
  start: number
  end: number
  err?: Error
  data: object
}

type Operator = (r: TaskResult, ctx: any, data: object) => Operate

class Ordu implements OrduIF {
  private topo: {
    add(t: Task, _: any): void
    nodes: Task[]
  }
  private operator_map: {
    [op: string]: Operator
  }

  constructor() {
    this.topo = new Topo.Sorter()

    this.operator_map = {
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
    this.operator_map[name] = opr || (first as Operator)
  }

  operators() {
    return this.operator_map
  }

  add(first: any, second?: any): void {
    if ('function' == typeof first) {
      second = second || {}
      let t = new Task(second)
      t.exec = first
      t.name = first.name ? first.name : t.name
      this.add_task(t)
    } else if (Array.isArray(first)) {
      for (var i = 0; i < first.length; i++) {
        let entry: TaskDef = first[i]
        if ('function' === typeof first[i]) {
          entry = { name: (first[i] as TaskExec).name, exec: first[i] }
        }
        this.add_task(entry)
      }
    } else {
      this.add_task(first)
    }
  }

  private add_task(td: TaskDef): void {
    let t = new Task(td)
    this.topo.add(t, {
      group: t.name,
      before: t.before,
      after: t.after,
    })
  }

  // TODO: execSync version when promises not needed
  async exec(ctx: any, data: any, opts: any): Promise<ExecResult> {
    opts = null == opts ? {} : opts
    let start = Date.now()
    let tasks: Task[] = this.topo.nodes

    let spec = {
      ctx: ctx || {},
      data: data || {},
    }

    let operate: Operate | Promise<Operate> = { stop: false, err: void 0 }
    let tasklog: any[] = []

    let task_count = 0
    let taskI = 0
    for (; taskI < tasks.length; taskI++) {
      let task = tasks[taskI]
      let taskout = null
      let tasklogentry: TaskLogEntry = {
        task,
        start: Date.now(),
        end: Number.MAX_SAFE_INTEGER,
      }

      if (this.task_if(task, spec.data)) {
        try {
          task_count++
          taskout = task.exec(spec)
          taskout = taskout instanceof Promise ? await taskout : taskout
        } catch (task_ex) {
          taskout = task_ex
          //console.log('RRR', taskout)
        }
      } else {
        taskout = { op: 'skip' }
      }

      tasklogentry.end = Date.now()
      let result = new TaskResult(tasklogentry, taskout)

      try {
        operate = this.operate(result, spec.ctx, spec.data)
        operate = (operate instanceof Promise
          ? await operate
          : operate) as Operate
      } catch (operate_ex) {
        //console.log('TTT', taskout)
        operate = {
          stop: true,
          err: operate_ex,
        }
      }

      tasklog.push({ name: task.name, op: result.op, task, result, operate })

      if (operate.stop) {
        break
      }
    }

    let execres: ExecResult = {
      tasklog: tasklog,
      task: operate.err ? tasks[taskI] : void 0,
      task_count: task_count,
      task_total: tasks.length,
      start: start,
      end: Date.now(),
      err: operate.err,
      data: spec.data,
    }

    if (opts.done) {
      opts.done(execres)
    }

    return execres
  }

  tasks() {
    return this.topo.nodes
  }

  private operate(r: TaskResult, ctx: any, data: object): Operate {
    if (r.err) {
      return {
        stop: true,
        err: r.err,
      }
    }

    let operator = this.operator_map[r.op]

    if (operator) {
      return operator(r, ctx, data)
    } else {
      return {
        stop: true,
        err: new Error('Unknown operation: ' + r.op),
      }
    }
  }

  private task_if(task: Task, data: object): boolean {
    if (task.if) {
      let task_if: { [k: string]: any } = task.if
      return Object.keys(task_if).reduce((proceed, k) => {
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

function strarr(x?: string | string[]) {
  return null == x ? [] : 'string' === typeof x ? [x] : x
}

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
