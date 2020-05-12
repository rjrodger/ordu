/* Copyright (c) 2016-2020 Richard Rodger and other contributors, MIT License */
'use strict'

import * as Hoek from '@hapi/hoek'
import * as Topo from '@hapi/topo'



export { Self as Ordu, LegacyOrdu }



interface Ordu {
  add(t: TaskDef): void
  tasks(): Task[]
}


interface TaskDef {
  id?: string
  name?: string
  before?: string | string[]
  after?: string | string[]
  exec?: (s: Spec) => any
  from?: object
  if?: { [k: string]: any }
}

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
    this.id = null == taskdef.id ? ('' + Math.random()).substring(2) : taskdef.id
    this.name = taskdef.name || 'task' + Task.count
    this.before = strarr(taskdef.before)
    this.after = strarr(taskdef.after)
    this.exec = taskdef.exec || ((_: Spec) => { })
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
  task: Task,
  start: number,
  end: number
}


// Use the constructor to normalize task result
class TaskResult {
  op: string
  out: object
  err?: Error
  log: TaskLogEntry

  constructor(log: TaskLogEntry, raw: any) {
    raw = null == raw ? {} : raw

    this.log = log
    this.out = null == raw.out ? {} : raw.out
    this.err = raw instanceof Error ? raw : void 0

    this.op =
      null != this.err ? 'stop' :
        'string' === typeof raw.op ? raw.op :
          'next'
  }
}

type Operate = {
  stop: boolean
  err?: Error
}

type ExecResult = {
  tasklog: any[],
  task?: Task
  task_count: number
  task_total: number
  start: number
  end: number
  err?: Error,
  data: object
}

type Operator = (r: TaskResult, ctx: any, data: object) => Operate


class Self implements Ordu {
  topo: {
    add(t: Task, _: any): void
    nodes: Task[]
  }
  operator_map: {
    //[op: string]: (r: TaskResult, ctx: any, data: object) => Operate
    [op: string]: Operator
  }

  constructor() {
    this.topo = new Topo.Sorter()

    this.operator_map = {
      next: () => ({ stop: false }),
      skip: () => ({ stop: false }),
      stop: (tr) => ({ stop: true, err: tr.err }),
      merge: (tr, _, data) => {
        Hoek.merge(data, tr.out)
        return { stop: false }
      }
    }
  }


  operator(name: string, opr: Operator) {
    this.operator_map[name] = opr
  }

  operators() { return this.operator_map }


  add(taskdef: TaskDef) {
    let t = new Task(taskdef)

    this.topo.add(t, {
      group: t.name,
      before: t.before,
      after: t.after
    })
  }

  async exec(ctx: any, data: any): Promise<ExecResult> {
    let start = Date.now()
    let tasks: Task[] = this.topo.nodes

    let spec = {
      ctx: ctx || {},
      data: data || {}
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
        end: Number.MAX_SAFE_INTEGER
      }

      if (this.task_if(task, spec.data)) {
        try {
          task_count++
          taskout = task.exec(spec)
          taskout = taskout instanceof Promise ? await taskout : taskout
        }
        catch (task_ex) {
          taskout = task_ex
        }
      }
      else {
        taskout = { op: 'skip' }
      }

      tasklogentry.end = Date.now()
      let result = new TaskResult(tasklogentry, taskout)

      try {
        operate = this.operate(result, spec.ctx, spec.data)
        operate = (operate instanceof Promise ? await operate : operate) as Operate
      }
      catch (operate_ex) {
        operate = {
          stop: true,
          err: operate_ex
        }
      }

      tasklog.push({ name: task.name, op: result.op, task, result, operate })

      if (operate.stop) {
        break
      }
    }

    return {
      tasklog: tasklog,
      task: operate.err ? tasks[taskI] : void 0,
      task_count: task_count,
      task_total: tasks.length,
      start: start,
      end: Date.now(),
      err: operate.err,
      data: spec.data
    }
  }

  tasks() {
    return this.topo.nodes
  }

  operate(r: TaskResult, ctx: any, data: object): Operate {
    let operator = this.operator_map[r.op]

    if (operator) {
      return operator(r, ctx, data)
    }
    else {
      return {
        stop: true,
        err: new Error('Unknown operation: ' + r.op)
      }
    }
  }

  private task_if(task: Task, data: object): boolean {
    if (task.if) {
      let task_if: { [k: string]: any } = task.if
      return Object
        .keys(task_if)
        .reduce((proceed, k) => {
          let part: any = Hoek.reach(data, k)

          return proceed &&
            Hoek.contain({ $: part }, { $: task_if[k] }, { deep: true })
        }, true)
    }
    else {
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
        value: opts.name + '_task' + tasks.length
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
    return tasks.map(function(v) {
      return v.name
    })
  }

  function api_taskdetails() {
    return tasks.map(function(v) {
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
