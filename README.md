# ordu

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/11434/branches/170370/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=11434&bid=170370)
[![Maintainability](https://api.codeclimate.com/v1/badges/47fe47f0b317507cb120/maintainability)](https://codeclimate.com/github/rjrodger/ordu/maintainability)

Execute task functions in a configurable order, sharing a context and
mutating a shared data structure. Used by the
[Seneca](http://senecajs.org) framework as its extension-point engine.

A Go port is also available — see [`go/README.md`](./go/README.md).

---

## Tutorial: your first ordu

Install:

```sh
npm install ordu
```

Build a small pipeline. Each task receives `{ ctx, data }` and may modify
`data` directly, or return a `{ op, out }` instruction:

```js
const { Ordu } = require('ordu')

const w = new Ordu()

w.add(function first(spec) {
  if (null == spec.data.foo) {
    return { op: 'stop', err: new Error('no foo') }
  }
  spec.data.foo = spec.data.foo.substring(0, spec.ctx.len)
})

w.add(function second(spec) {
  spec.data.foo = spec.data.foo.toUpperCase()
})

const ctx  = { len: 3 }
const data = { foo: 'green' }

const res = await w.exec(ctx, data)
console.log(res.data.foo)  // → 'GRE'
```

Tasks run in the order added. `data` is the shared, mutable structure;
`ctx` is read-mostly context that travels alongside it. The return
value of `exec` is a structured result containing the final `data`,
the task log, and any error.

For synchronous pipelines, use `execSync` and tasks that don't return
promises.

---

## How-to guides

### Choose what happens after a task: operators

Each task can return `{ op, out, err, why }`. The `op` field names an
**operator** that decides whether to continue and how to fold `out`
back into `data`.

| `op`     | Effect                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| `next`   | Continue to the next task. `out` is ignored.                                        |
| `merge`  | Merge `out` into `data` (reference-preserving via `nua`), then continue.            |
| `stop`   | Merge `out` into `data`, then stop. `err` is propagated to the caller.              |
| `skip`   | Continue, marking the task as skipped (no merge).                                   |
| _custom_ | Any operator registered with `w.operator(name, fn)`.                                |

```js
w.add(() => ({ op: 'merge', out: { stage: 'parsed' } }))
w.add(() => ({ op: 'stop',  err: new Error('halt'), why: 'unauthorized' }))
```

Returning `null` or `undefined` is equivalent to `{ op: 'next' }`.

### Register a custom operator

```js
w.operator('retry', (taskResult, ctx, data) => {
  data._retries = (data._retries || 0) + 1
  return { stop: data._retries > 3 }
})

w.add(() => ({ op: 'retry' }))
```

Operators receive the `TaskResult`, the `ctx`, and the `data` object,
and return `{ stop: boolean, err?: Error }`. They may be `async`.

### Order tasks with `before` / `after`

Tasks are inserted at the position implied by their `before`/`after`
references. If neither is given they are appended:

```js
w.add({ name: 'parse',    exec: parse })
w.add({ name: 'validate', exec: validate })
w.add({ name: 'log',      after: 'parse', exec: log })
// order: parse, log, validate
```

### Run a task only when `data` matches a pattern

```js
w.add({
  if: { stage: 'parsed', kind: 'request' },
  exec: handleRequest,
})
```

Each `if` key is a dot-separated path into `data`; values match by deep
equality (objects/arrays match if they are deeply contained).

### Restrict execution to a subset (`active` flag)

A task with `active: false` is skipped on every run, but stays in the
list (so tooling can still see it):

```js
w.add({ name: 'debug-dump', active: false, exec: dump })
```

### Tag-based filtering

`if` plus a tag-style key on `data` lets you flip subsets on per-run:

```js
w.add({ if: { upper: true }, exec: (s) => { s.data.foo = s.data.foo.toUpperCase() }})

await w.exec({}, { foo: 'green', upper: true })   // → 'GREEN'
await w.exec({}, { foo: 'green' })                // → 'green'
```

### Walk into nested data with `select` + `apply`

`select` picks a child collection out of `data` (by dot-path or
function); `apply` is a sub-pipeline run once per child. The
sub-pipeline's task receives the child as `spec.node`:

```js
w.add({
  select: 'items',
  apply: [
    function tally(s) { s.data.total = (s.data.total || 0) + s.node.val.qty },
  ],
})

await w.exec({}, { items: [{ qty: 1 }, { qty: 2 }, { qty: 3 }], total: 0 })
// → data.total === 6
```

`select` may also be a function `(source, spec) => any`, useful when
the child set isn't directly addressable by path.

### Observe progress with events

```js
w.on('task-result', (result) => console.log(result.name, result.op))
w.on('task-end',    (entry)  => console.log('done', entry.name))
```

The `Ordu` class extends `EventEmitter`. Events fire synchronously
during execution.

### Sort selected children

When applying to a collection, sort children alphabetically by key:

```js
await w.exec({}, data, { select: { sort: 1 } })   // ascending
await w.exec({}, data, { select: { sort: -1 } })  // descending
```

---

## Reference

### `new Ordu(opts?)`

Construct an ordu. Options:

| Option          | Type                                | Default | Description                                                  |
| --------------- | ----------------------------------- | ------- | ------------------------------------------------------------ |
| `debug`         | `boolean`                           | `false` | Capture call sites for `add()` and snapshot `data` per task. |
| `select.sort`   | `number \| null`                    | `null`  | Default sort direction for `select`+`apply` children.        |

### Instance methods

| Method                                   | Description                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `add(taskDef \| taskExec \| array)`      | Register one or more tasks. Returns `this`.                                  |
| `tasks()`                                | Return the ordered task list.                                                |
| `task[name]`                             | Map of registered tasks by name.                                             |
| `operator(name, fn)` / `operator(fn)`    | Register an operator (uses `fn.name` if name is omitted).                    |
| `operators()`                            | Return the operator map.                                                     |
| `exec(ctx?, data?, opts?)`               | Run the pipeline, returning a `Promise<ExecResult>`.                         |
| `execSync(ctx?, data?, opts?)`           | Synchronous variant; throws if any task returns a Promise.                   |

### `TaskDef`

```ts
{
  id?:     string                // stable identifier (default: random)
  name?:   string                // default: `task<N>`
  before?: string                // insert before this task name
  after?:  string                // insert after this task name
  exec?:   (spec: TaskSpec) => any
  if?:     { [path: string]: any }
  active?: boolean               // default: true
  meta?:   any
  select?: string | ((source, spec) => any)
  apply?:  TaskDef | TaskDef[]
}
```

### `TaskSpec` (passed to `exec`)

```ts
{ ctx, data, task, async, opts?, node? }
```

`node` is set inside `select`+`apply` sub-tasks to `{ key, val }` for
the current child.

### `TaskExec` return shape

```ts
{ op?: string, out?: object, err?: Error, why?: string } | void
```

### `ExecResult`

```ts
{
  tasklog:    TaskLogEntry[]
  task?:      Task                // the task that errored, if any
  taskcount:  number              // tasks actually executed
  tasktotal:  number              // tasks considered
  start:      number              // ms since epoch
  end:        number
  err?:       Error
  data:       any                 // the (mutated) data object
}
```

### Built-in operators

`next`, `merge`, `stop`, `skip` (see the How-to guide above).

### Events

| Event         | Payload                                                  |
| ------------- | -------------------------------------------------------- |
| `task-result` | `TaskResult`                                             |
| `task-end`    | `{ name, op, task, result, operate, data? }`             |

---

## Explanation: why an ordered task list?

A lot of frameworks need an extension point that is more than "fire a
hook" but less than a full plugin system. You want:

- **Determinism.** The order tasks run in is the order you registered
  them, with explicit `before`/`after` overrides — not the order
  modules happened to load.
- **Inspection.** `tasks()` lists exactly what will run; `tasklog`
  records what _did_ run, with timings and operator decisions.
- **In-place data.** A shared `data` object is mutated as it flows
  through the pipeline, with `nua`-backed merges so external references
  to inner objects stay live across `merge` operations.
- **Early exit without throwing.** Returning `{ op: 'stop', err }` ends
  the run cleanly and surfaces the error in `ExecResult.err`, with the
  failing task in `ExecResult.task`.

The trade-off is that `data` is mutable and shared. If you want
immutability, copy `data` before calling `exec`, or use an operator
that produces a fresh object instead of merging.

`select` + `apply` exist for the (common) case where one stage of the
pipeline needs to fan out over a child collection. Doing it as nested
ordus keeps the same operator/event machinery available at each level.

---

## Notes

From the Irish [_ord&uacute;_](http://www.focloir.ie/en/dictionary/ei/instruction)
("instruction"). Pronounced _or-doo_.

## License

Copyright (c) 2014-2025, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[travis-badge]: https://travis-ci.org/rjrodger/ordu.svg
[travis-url]: https://travis-ci.org/rjrodger/ordu
[npm-badge]: https://img.shields.io/npm/v/ordu.svg
[npm-url]: https://npmjs.com/package/ordu
[david-badge]: https://david-dm.org/rjrodger/ordu.svg
[david-url]: https://david-dm.org/rjrodger/ordu
[coveralls-badge]: https://coveralls.io/repos/github/rjrodger/ordu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/rjrodger/ordu?branch=master
