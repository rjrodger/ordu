# ordu (Go)

Execute task functions in a configurable order, sharing a context and
mutating a shared `map[string]any`.

**Version:** `0.1.0` (exported as the `ordu.Version` constant in `ordu.go`).

This is the Go port of the [JavaScript / TypeScript `ordu` package](../README.md).
The behavior matches the JS version except for points called out in the
[Explanation](#explanation-design-notes-and-go-specific-caveats) section.

Merging into the shared `data` map is delegated to
[`github.com/rjrodger/nua/go`](https://github.com/rjrodger/nua), which
preserves nested map and slice references where possible.

---

## Tutorial: your first ordu

Install:

```sh
go get github.com/rjrodger/ordu/go
```

Build a small pipeline. Each task receives a `*TaskSpec` (carrying
`Ctx` and `Data`) and may modify `Data` directly, or return a
`*TaskReturn` that names an operator:

```go
package main

import (
    "errors"
    "fmt"
    "strings"

    ordu "github.com/rjrodger/ordu/go"
)

func main() {
    w := ordu.New(nil)

    w.Add(&ordu.TaskDef{
        Name: "first",
        Exec: func(s *ordu.TaskSpec) *ordu.TaskReturn {
            foo, _ := s.Data["foo"].(string)
            if foo == "" {
                return &ordu.TaskReturn{Op: "stop", Err: errors.New("no foo")}
            }
            n, _ := s.Ctx["len"].(int)
            s.Data["foo"] = foo[:n]
            return nil
        },
    })

    w.Add(&ordu.TaskDef{
        Name: "second",
        Exec: func(s *ordu.TaskSpec) *ordu.TaskReturn {
            foo, _ := s.Data["foo"].(string)
            s.Data["foo"] = strings.ToUpper(foo)
            return nil
        },
    })

    ctx  := map[string]any{"len": 3}
    data := map[string]any{"foo": "green"}

    res := w.Exec(ctx, data, nil)
    fmt.Println(res.Data["foo"]) // → "GRE"
}
```

Tasks run in the order added. `Data` is the shared, mutable map; `Ctx`
is read-mostly context that travels alongside it. `Exec` returns an
`*ExecResult` containing the final `Data`, the task log, and any error.

---

## How-to guides

### Choose what happens after a task: operators

Each task can return a `*TaskReturn{Op, Out, Err, Why}`. The `Op`
field names an **operator** that decides whether to continue and how
to fold `Out` back into `Data`.

| `Op`     | Effect                                                                             |
| -------- | ---------------------------------------------------------------------------------- |
| `next`   | Continue to the next task. `Out` is ignored.                                       |
| `merge`  | Merge `Out` into `Data` via `nua` (reference-preserving), then continue.           |
| `stop`   | Merge `Out` into `Data`, then stop. `Err` is propagated to the caller.             |
| `skip`   | Continue, marking the task as skipped (no merge).                                  |
| _custom_ | Any operator registered with `w.SetOperator(name, fn)`.                            |

Returning `nil` is equivalent to `&TaskReturn{Op: "next"}`. Returning a
non-nil `Err` forces `Op` to `"stop"`.

### Register a custom operator

```go
w.SetOperator("retry", func(r *ordu.TaskResult, ctx, data map[string]any) (*ordu.Operate, error) {
    n, _ := data["_retries"].(int)
    n++
    data["_retries"] = n
    return &ordu.Operate{Stop: n > 3}, nil
})
```

Operators receive the `*TaskResult`, the `ctx`, and the `data` map,
and return `(*Operate, error)`.

### Order tasks with `Before` / `After`

```go
w.Add(&ordu.TaskDef{Name: "parse",    Exec: parse})
w.Add(&ordu.TaskDef{Name: "validate", Exec: validate})
w.Add(&ordu.TaskDef{Name: "log", After: "parse", Exec: logTask})
// order: parse, log, validate
```

Tasks with neither `Before` nor `After` are appended.

### Run a task only when `Data` matches a pattern

```go
w.Add(&ordu.TaskDef{
    If: map[string]any{
        "stage": "parsed",
        "kind":  "request",
    },
    Exec: handleRequest,
})
```

Each `If` key is a dot-separated path into `Data`; values match by
deep containment (numbers compare across `int`/`float64`).

### Disable a task with `Active`

```go
w.Add(&ordu.TaskDef{
    Name:   "debug-dump",
    Active: ordu.Active(false), // helper for *bool
    Exec:   dump,
})
```

A task with `Active: false` stays in the list but is skipped on every
run.

### Walk into nested data with `Select` + `Apply`

`Select` picks a child collection out of `Data` (a dot-path string or
a `SelectFunc`); `Apply` is a sub-pipeline run once per child. The
sub-pipeline's task receives the child as `s.Node`:

```go
tally := func(s *ordu.TaskSpec) *ordu.TaskReturn {
    cur, _ := s.Data["total"].(int)
    if m, ok := s.Node.Val.(map[string]any); ok {
        if q, ok := m["qty"].(int); ok {
            s.Data["total"] = cur + q
        }
    }
    return nil
}

w.Add(&ordu.TaskDef{
    Select: "items",
    Apply:  &ordu.TaskDef{Name: "tally", Exec: tally},
})

data := map[string]any{
    "items": []any{
        map[string]any{"qty": 1},
        map[string]any{"qty": 2},
        map[string]any{"qty": 3},
    },
    "total": 0,
}

w.Exec(nil, data, nil) // → data["total"] == 6
```

`Apply` accepts `*TaskDef`, `[]*TaskDef`, or a bare `TaskExec`.

### Sort selected children

```go
sortDir := ordu.SortDir(1) // ascending; -1 for descending
w.Exec(nil, data, &ordu.Options{Select: ordu.SelectOptions{Sort: sortDir}})
```

Children are sorted alphabetically by string-formatted key.

### Observe progress with handlers

```go
w.OnTaskResult = func(r *ordu.TaskResult) {
    fmt.Println(r.Name, r.Op)
}
w.OnTaskEnd = func(e *ordu.TaskLogEntry) {
    fmt.Println("done", e.Name)
}
```

Handlers fire synchronously during execution (the JS version emits
events; Go uses these direct callbacks).

---

## Reference

### `func New(opts *Options) *Ordu`

Construct a new ordu. `nil` opts give defaults.

### Options

```go
type Options struct {
    Debug  bool
    Select SelectOptions
}

type SelectOptions struct {
    Sort *int // 1 ascending, -1 descending; nil = no sort
}
```

### Methods on `*Ordu`

| Method                                      | Description                                                |
| ------------------------------------------- | ---------------------------------------------------------- |
| `Add(tds ...*TaskDef) *Ordu`                | Register one or more tasks. Returns the receiver.          |
| `AddExec(name string, exec TaskExec) *Ordu` | Register a task from a bare `TaskExec`.                    |
| `Tasks() []*Task`                           | Return a copy of the ordered task list.                    |
| `Task` (field, `map[string]*Task`)          | Lookup tasks by name.                                      |
| `SetOperator(name string, opr Operator)`    | Register an operator.                                      |
| `Operators() map[string]Operator`           | Return the operator map.                                   |
| `Exec(ctx, data map[string]any, opts *Options, node ...*Node) *ExecResult` | Run the pipeline.    |
| `OnTaskResult` / `OnTaskEnd` (fields)       | Optional progress callbacks.                               |

### `TaskDef`

```go
type TaskDef struct {
    ID     string
    Name   string
    Before string
    After  string
    Exec   TaskExec
    If     map[string]any
    Active *bool                  // use ordu.Active(true|false)
    Meta   map[string]any
    Select any                    // string path or SelectFunc
    Apply  any                    // *TaskDef, []*TaskDef, or TaskExec
}
```

### `TaskSpec` (passed to `Exec`)

```go
type TaskSpec struct {
    Ctx  map[string]any
    Data map[string]any
    Task *Task
    Opts *Options
    Node *Node // set inside Select+Apply sub-tasks
}
```

### `TaskReturn`

```go
type TaskReturn struct {
    Op  string         // "next", "merge", "stop", "skip", or custom
    Out map[string]any
    Err error
    Why string
}
```

### `ExecResult`

```go
type ExecResult struct {
    TaskLog   []TaskLogEntry
    Task      *Task             // the task that errored, if any
    TaskCount int               // tasks actually executed
    TaskTotal int               // tasks considered
    Start     int64             // ms since epoch
    End       int64
    Err       error
    Data      map[string]any    // the (mutated) data map
}
```

### Helpers

```go
func Active(v bool) *bool   // for TaskDef.Active
func SortDir(v int) *int    // for SelectOptions.Sort
```

### Built-in operators

`next`, `merge`, `stop`, `skip` (see the How-to guide above).

### Constants

```go
const Version = "0.1.0"
```

---

## Explanation: design notes and Go-specific caveats

The point of `ordu` is to let a library — Seneca being the original
example — define an extension surface that:

- runs in a deterministic order, with explicit `Before`/`After`
  overrides instead of import-order accidents,
- can be inspected from outside (`Tasks()` lists what _will_ run;
  `TaskLog` records what _did_ run, with timings and operator
  decisions),
- mutates a shared `map[string]any` in place, so observers wired to
  inner maps keep their references across `merge` operations,
- exits cleanly via `{Op: "stop", Err: ...}` rather than panicking,
  surfacing the error in `ExecResult.Err` and the failing task in
  `ExecResult.Task`.

**Why a `map[string]any` instead of a typed value?** ordu is plumbing
for plugin pipelines that don't know each other's types. The cost is
unsigned-everything at the boundary; the gain is that any pipeline
stage can read and write any field without coordinating types up
front. If you control the pipeline end-to-end, you can wrap `ordu` in
a typed helper that converts in and out at the edges.

**Reference preservation.** `merge` and `stop` fold a task's `Out` map
into `Data` using [`nua`](https://github.com/rjrodger/nua) with
`WithPreserve(true)`. This means:

- Existing keys in `Data` that aren't in `Out` are kept.
- Inner maps in `Data` are mutated in place, so outside references
  into them stay live.
- Slice growth past capacity will reallocate the backing array — the
  same caveat as in `nua` itself. Allocate with enough capacity
  upfront if slice identity matters.

**Synchronous execution.** The Go port is synchronous (no async/await
analogue). Tasks may block; if a task panics, the panic is recovered
and reported as a task error rather than crashing the run.

**Differences from the JS version.** The JS version exposes both
`exec` (Promise-returning) and `execSync`. The Go version has a single
`Exec` that runs synchronously. The JS version emits events
(`task-result`, `task-end`) via `EventEmitter`; the Go version uses
the `OnTaskResult` / `OnTaskEnd` callback fields on `*Ordu` for the
same purpose.

---

## License

Copyright (c) 2014-2025, Richard Rodger and other contributors.
Licensed under [MIT](../LICENSE).
