// Copyright (c) 2016-2025 Richard Rodger and other contributors, MIT License

package ordu

import (
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"strings"
	"time"

	nua "github.com/rjrodger/nua/go"
)

// Version is the current version of the ordu Go module.
const Version = "0.1.1"

var taskCount int

// TaskExec is the function signature for task execution.
type TaskExec func(s *TaskSpec) *TaskReturn

// SelectFunc is a function-based selector for child tasks.
type SelectFunc func(source map[string]any, s *TaskSpec) any

// TaskDef defines a task to add to an Ordu instance.
type TaskDef struct {
	ID     string
	Name   string
	Before string
	After  string
	Exec   TaskExec
	If     map[string]any
	Active *bool
	Meta   map[string]any

	// Select specifies a path (string) or function (SelectFunc) to select children.
	// An empty string means root.
	Select any

	// Apply specifies child task definitions: a *TaskDef or []*TaskDef.
	Apply any
}

// TaskReturn is returned by a TaskExec function.
type TaskReturn struct {
	Op  string
	Out map[string]any
	Err error
	Why string
}

// TaskSpec is passed to a TaskExec function.
type TaskSpec struct {
	Ctx  map[string]any
	Data map[string]any
	Task *Task
	Opts *Options
	Node *Node
}

// Node represents a child element during select/apply iteration.
type Node struct {
	Key any
	Val any
}

// Task is an internal representation of a task after normalization.
type Task struct {
	RunID  string
	Name   string
	Before string
	After  string
	Exec   TaskExec
	If     map[string]any
	Active bool
	Meta   map[string]any
}

// TaskResult captures the result of executing a single task.
type TaskResult struct {
	Op    string
	Out   map[string]any
	Err   error
	Why   string
	Task  *Task
	Name  string
	Start int64
	End   int64
	RunID string
	Index int
	Total int
}

func (tr *TaskResult) update(ret *TaskReturn) {
	if ret == nil {
		tr.Out = map[string]any{}
		tr.Op = "next"
		tr.Why = ""
		return
	}

	if ret.Out == nil {
		tr.Out = map[string]any{}
	} else {
		tr.Out = ret.Out
	}

	tr.Err = ret.Err

	if tr.Err != nil {
		tr.Op = "stop"
	} else if ret.Op != "" {
		tr.Op = ret.Op
	} else {
		tr.Op = "next"
	}

	tr.Why = ret.Why
}

// Operate is the result of an operator function.
type Operate struct {
	Stop bool
	Err  error
}

// Operator processes a task result and decides whether to continue.
type Operator func(r *TaskResult, ctx map[string]any, data map[string]any) (*Operate, error)

// TaskLogEntry is an entry in the execution task log.
type TaskLogEntry struct {
	Name    string
	Op      string
	Task    *Task
	Result  *TaskResult
	Operate *Operate
	Data    map[string]any
}

// ExecResult is the result of executing an Ordu task list.
type ExecResult struct {
	TaskLog   []TaskLogEntry
	Task      *Task
	TaskCount int
	TaskTotal int
	Start     int64
	End       int64
	Err       error
	Data      map[string]any
}

// Options configures an Ordu instance.
type Options struct {
	Debug  bool
	Select SelectOptions
}

// SelectOptions controls child selection sorting.
type SelectOptions struct {
	Sort *int
}

// TaskResultHandler is called after each task result.
type TaskResultHandler func(tr *TaskResult)

// TaskEndHandler is called after each task completes.
type TaskEndHandler func(entry *TaskLogEntry)

// Ordu executes functions in a configurable order, modifying shared data.
type Ordu struct {
	opts        Options
	tasks       []*Task
	operatorMap map[string]Operator
	Task        map[string]*Task

	OnTaskResult TaskResultHandler
	OnTaskEnd    TaskEndHandler
}

// New creates a new Ordu instance with the given options.
func New(opts *Options) *Ordu {
	o := &Ordu{
		tasks:       []*Task{},
		operatorMap: map[string]Operator{},
		Task:        map[string]*Task{},
	}

	if opts != nil {
		o.opts = *opts
	}

	o.operatorMap["next"] = func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		return &Operate{Stop: false}, nil
	}

	o.operatorMap["skip"] = func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		return &Operate{Stop: false}, nil
	}

	o.operatorMap["stop"] = func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		nua.Merge(data, r.Out, nua.WithPreserve(true))
		return &Operate{Stop: true, Err: r.Err}, nil
	}

	o.operatorMap["merge"] = func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		nua.Merge(data, r.Out, nua.WithPreserve(true))
		return &Operate{Stop: false}, nil
	}

	return o
}

// SetOperator registers a named operator.
func (o *Ordu) SetOperator(name string, opr Operator) {
	o.operatorMap[name] = opr
}

// Operators returns the operator map.
func (o *Ordu) Operators() map[string]Operator {
	return o.operatorMap
}

// Add adds one or more task definitions to the Ordu instance.
func (o *Ordu) Add(tds ...*TaskDef) *Ordu {
	for _, td := range tds {
		o.addTask(td)
	}
	return o
}

// AddExec adds a task from a bare exec function and optional name.
func (o *Ordu) AddExec(name string, exec TaskExec) *Ordu {
	o.addTask(&TaskDef{Name: name, Exec: exec})
	return o
}

// Tasks returns a copy of the task list.
func (o *Ordu) Tasks() []*Task {
	out := make([]*Task, len(o.tasks))
	copy(out, o.tasks)
	return out
}

func (o *Ordu) addTask(td *TaskDef) {
	t := newTask(td, o)

	tI := 0
	for ; tI < len(o.tasks); tI++ {
		if t.Before != "" && o.tasks[tI].Name == t.Before {
			break
		} else if t.After != "" && o.tasks[tI].Name == t.After {
			tI++
			break
		}
	}

	// splice insert
	o.tasks = append(o.tasks, nil)
	copy(o.tasks[tI+1:], o.tasks[tI:])
	o.tasks[tI] = t

	o.Task[t.Name] = t
}

func newTask(td *TaskDef, parent *Ordu) *Task {
	t := &Task{}

	if td.ID != "" {
		t.RunID = td.ID
	} else {
		t.RunID = fmt.Sprintf("%d", rand.Int63())
	}

	if td.Name != "" {
		t.Name = td.Name
	} else {
		t.Name = fmt.Sprintf("task%d", taskCount)
		taskCount++
	}

	t.Before = td.Before
	t.After = td.After

	if td.Exec != nil {
		t.Exec = td.Exec
	} else {
		t.Exec = func(s *TaskSpec) *TaskReturn { return nil }
	}

	t.If = td.If

	if td.Active != nil {
		t.Active = *td.Active
	} else {
		t.Active = true
	}

	t.Meta = td.Meta
	if t.Meta == nil {
		t.Meta = map[string]any{}
	}
	t.Meta["when"] = time.Now().UnixMilli()

	// Selection
	if td.Select != nil {
		setupSelect(t, td, parent)
	}

	return t
}

func setupSelect(t *Task, td *TaskDef, parent *Ordu) {
	cordu := New(nil)

	switch apply := td.Apply.(type) {
	case *TaskDef:
		cordu.Add(apply)
	case []*TaskDef:
		cordu.Add(apply...)
	case TaskExec:
		cordu.AddExec("", apply)
	}

	t.Exec = func(s *TaskSpec) *TaskReturn {
		var source map[string]any
		if s.Node != nil {
			if m, ok := s.Node.Val.(map[string]any); ok {
				source = m
			}
		}
		if source == nil {
			source = s.Data
		}
		if source == nil {
			source = map[string]any{}
		}

		var target any

		switch sel := td.Select.(type) {
		case string:
			if sel == "" {
				target = source
			} else {
				target = reach(source, sel)
			}
		case SelectFunc:
			target = sel(source, s)
		}

		type child struct {
			key any
			val any
		}

		var children []child

		switch v := target.(type) {
		case []any:
			for i, n := range v {
				children = append(children, child{key: i, val: n})
			}
		case map[string]any:
			for k, n := range v {
				children = append(children, child{key: k, val: n})
			}
		}

		if s.Opts != nil && s.Opts.Select.Sort != nil {
			dir := 1
			if *s.Opts.Select.Sort < 0 {
				dir = -1
			}
			sort.SliceStable(children, func(i, j int) bool {
				ki := fmt.Sprintf("%v", children[i].key)
				kj := fmt.Sprintf("%v", children[j].key)
				if dir > 0 {
					return ki < kj
				}
				return ki > kj
			})
		}

		for _, c := range children {
			node := &Node{Key: c.key, Val: c.val}
			cres := cordu.Exec(s.Ctx, s.Data, s.Opts, node)
			if cres.Err != nil {
				return &TaskReturn{Err: cres.Err}
			}
		}

		return nil
	}
}

// Exec executes the task list synchronously.
func (o *Ordu) Exec(ctx, data map[string]any, opts *Options, node ...*Node) *ExecResult {
	if ctx == nil {
		ctx = map[string]any{}
	}
	if data == nil {
		data = map[string]any{}
	}

	mergedOpts := o.opts
	if opts != nil {
		if opts.Debug {
			mergedOpts.Debug = true
		}
		if opts.Select.Sort != nil {
			mergedOpts.Select.Sort = opts.Select.Sort
		}
	}

	runid := fmt.Sprintf("%d", rand.Int63())
	start := time.Now().UnixMilli()
	tasks := make([]*Task, len(o.tasks))
	copy(tasks, o.tasks)

	var tasklog []TaskLogEntry
	taskcount := 0
	lastTaskI := 0
	var lastOperate *Operate

	var curNode *Node
	if len(node) > 0 {
		curNode = node[0]
	}

	for taskI := 0; taskI < len(tasks); {
		lastTaskI = taskI
		task := tasks[taskI]

		result := &TaskResult{
			Op:    "not-defined",
			Task:  task,
			Name:  task.Name,
			Start: time.Now().UnixMilli(),
			End:   0,
			Index: taskI,
			Total: len(tasks),
			RunID: runid,
		}

		var ret *TaskReturn

		if task.Active && o.taskIf(task, data) {
			taskcount++

			spec := &TaskSpec{
				Ctx:  ctx,
				Data: data,
				Task: task,
				Opts: &mergedOpts,
				Node: curNode,
			}

			func() {
				defer func() {
					if r := recover(); r != nil {
						if err, ok := r.(error); ok {
							ret = &TaskReturn{Err: err}
						} else {
							ret = &TaskReturn{Err: fmt.Errorf("%v", r)}
						}
					}
				}()
				ret = task.Exec(spec)
			}()
		} else {
			ret = &TaskReturn{Op: "skip"}
		}

		result.End = time.Now().UnixMilli()
		result.update(ret)

		if o.OnTaskResult != nil {
			o.OnTaskResult(result)
		}

		operate := &Operate{}
		opr, oprErr := o.operate(result, ctx, data)
		if oprErr != nil {
			operate.Stop = true
			operate.Err = oprErr
		} else {
			operate = opr
		}

		lastOperate = operate

		entry := TaskLogEntry{
			Name:    task.Name,
			Op:      result.Op,
			Task:    task,
			Result:  result,
			Operate: operate,
		}
		tasklog = append(tasklog, entry)

		if o.OnTaskEnd != nil {
			o.OnTaskEnd(&entry)
		}

		if operate.Stop {
			break
		}
		taskI++
	}

	var finalErr error
	if lastOperate != nil {
		finalErr = lastOperate.Err
	}

	var errTask *Task
	if finalErr != nil {
		errTask = tasks[lastTaskI]
	}

	return &ExecResult{
		TaskLog:   tasklog,
		Task:      errTask,
		TaskCount: taskcount,
		TaskTotal: len(tasks),
		Start:     start,
		End:       time.Now().UnixMilli(),
		Err:       finalErr,
		Data:      data,
	}
}

func (o *Ordu) operate(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
	if r.Err != nil {
		return &Operate{Stop: true, Err: r.Err}, nil
	}

	operator, ok := o.operatorMap[r.Op]
	if !ok {
		return &Operate{Stop: true, Err: fmt.Errorf("Unknown operation: %s", r.Op)}, nil
	}

	return operator(r, ctx, data)
}

func (o *Ordu) taskIf(task *Task, data map[string]any) bool {
	if task.If == nil {
		return true
	}

	for k, expected := range task.If {
		part := reach(data, k)
		if !deepContain(part, expected) {
			return false
		}
	}

	return true
}

// reach accesses a nested property via dot-separated path.
func reach(obj map[string]any, path string) any {
	parts := strings.Split(path, ".")
	var current any = obj
	for _, part := range parts {
		if current == nil {
			return nil
		}
		switch m := current.(type) {
		case map[string]any:
			current = m[part]
		default:
			return nil
		}
	}
	return current
}

// deepContain checks if actual deeply contains expected.
func deepContain(actual, expected any) bool {
	if actual == expected {
		return true
	}

	if expected == nil || actual == nil {
		return false
	}

	switch exp := expected.(type) {
	case int:
		switch act := actual.(type) {
		case int:
			return act == exp
		case float64:
			return act == float64(exp)
		}
		return false
	case float64:
		switch act := actual.(type) {
		case float64:
			return act == exp
		case int:
			return float64(act) == exp
		}
		return false
	case string:
		act, ok := actual.(string)
		return ok && act == exp
	case bool:
		act, ok := actual.(bool)
		return ok && act == exp
	case []any:
		act, ok := actual.([]any)
		if !ok {
			return false
		}
		for i, v := range exp {
			if i >= len(act) {
				return false
			}
			if !deepContain(act[i], v) {
				return false
			}
		}
		return true
	case map[string]any:
		act, ok := actual.(map[string]any)
		if !ok {
			return false
		}
		for k, v := range exp {
			if !deepContain(act[k], v) {
				return false
			}
		}
		return true
	}

	return errors.Is(expected.(error), actual.(error))
}

// Active returns a pointer to a bool, for use with TaskDef.Active.
func Active(v bool) *bool {
	return &v
}

// SortDir returns a pointer to an int, for use with SelectOptions.Sort.
func SortDir(v int) *int {
	return &v
}
