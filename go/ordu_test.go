// Copyright (c) 2016-2025 Richard Rodger and other contributors, MIT License

package ordu

import (
	"errors"
	"fmt"
	"testing"
)

func TestSanity(t *testing.T) {
	h0 := New(nil)
	if h0 == nil {
		t.Fatal("expected non-nil Ordu")
	}
}

func TestHappy(t *testing.T) {
	h0 := New(nil)

	h0.AddExec("", func(s *TaskSpec) *TaskReturn {
		x, _ := s.Data["x"].(int)
		return &TaskReturn{
			Op:  "merge",
			Out: map[string]any{"y": x * 10},
		}
	})

	o0 := h0.Exec(nil, map[string]any{"x": 11}, nil)
	expectDeep(t, o0.Data, map[string]any{"x": 11, "y": 110})

	o1 := h0.Exec(nil, map[string]any{"x": 22}, nil)
	expectDeep(t, o1.Data, map[string]any{"x": 22, "y": 220})
}

func TestBasic(t *testing.T) {
	tc := taskCount
	h0 := New(nil)

	var taskResultLog []*TaskResult
	var taskEndLog []*TaskLogEntry

	h0.OnTaskResult = func(tr *TaskResult) {
		taskResultLog = append(taskResultLog, tr)
	}
	h0.OnTaskEnd = func(entry *TaskLogEntry) {
		taskEndLog = append(taskEndLog, entry)
	}

	// Task A - no exec
	h0.Add(&TaskDef{Name: "A"})

	// Task B - inactive
	h0.Add(&TaskDef{Name: "B", Active: Active(false)})

	// Task with error handling
	h0.AddExec("errtask", func(s *TaskSpec) *TaskReturn {
		if s.Ctx["err0"] == true {
			panic(errors.New("err0"))
		}
		if s.Ctx["err2"] == true {
			return &TaskReturn{Op: "not-an-op"}
		}
		return nil
	})

	// Merge task
	h0.Add(&TaskDef{
		ID: "0",
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "merge", Out: map[string]any{"x": 2}, Why: "some-reason"}
		},
	})

	// Conditional task (should be skipped when x!=4 or xx!=40)
	h0.Add(&TaskDef{
		If: map[string]any{"x": 4, "xx": 40},
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "merge", Out: map[string]any{"q": 1}}
		},
	})

	// Task b
	h0.Add(&TaskDef{
		Name: "b",
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "merge", Out: map[string]any{"x": 4}}
		},
	})

	// Task c with custom operator
	h0.Add(&TaskDef{
		Name: "c",
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "lookup", Out: map[string]any{"id": "001"}}
		},
	})

	// Conditional task (should run when x==4)
	h0.Add(&TaskDef{
		If: map[string]any{"x": 4},
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "merge", Out: map[string]any{"qq": 2}}
		},
	})

	// Stop task
	h0.Add(&TaskDef{
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "stop", Out: map[string]any{"last": 99}}
		},
	})

	// Should never be reached
	h0.Add(&TaskDef{
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Op: "merge", Out: map[string]any{"should-never-be-reached": true}}
		},
	})

	// Register lookup operator
	h0.SetOperator("lookup", func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		if ctx["err1"] == true {
			return nil, errors.New("err1")
		}
		data["y"] = r.Out
		return &Operate{Stop: false}, nil
	})

	expectEqual(t, len(h0.Tasks()), 10)

	out := h0.Exec(nil, nil, nil)
	expectDeep(t, out.Data, map[string]any{"x": 4, "y": map[string]any{"id": "001"}, "qq": 2, "last": 99})
	expectEqual(t, out.TaskCount, 7)
	expectEqual(t, out.TaskTotal, 10)

	// Check task result log
	resultOps := make([]string, len(taskResultLog))
	for i, tr := range taskResultLog {
		resultOps[i] = tr.Name + "~" + tr.Op
	}
	expectDeepStr(t, resultOps, []string{
		"A~next",
		"B~skip",
		"errtask~next",
		fmt.Sprintf("task%d~merge", tc),
		fmt.Sprintf("task%d~skip", tc+1),
		"b~merge",
		"c~lookup",
		fmt.Sprintf("task%d~merge", tc+2),
		fmt.Sprintf("task%d~stop", tc+3),
	})

	// Check task end log
	endOps := make([]string, len(taskEndLog))
	for i, te := range taskEndLog {
		endOps[i] = fmt.Sprintf("%s~%s~%v", te.Name, te.Op, te.Operate.Stop)
	}
	expectDeepStr(t, endOps, []string{
		"A~next~false",
		"B~skip~false",
		"errtask~next~false",
		fmt.Sprintf("task%d~merge~false", tc),
		fmt.Sprintf("task%d~skip~false", tc+1),
		"b~merge~false",
		"c~lookup~false",
		fmt.Sprintf("task%d~merge~false", tc+2),
		fmt.Sprintf("task%d~stop~true", tc+3),
	})

	// With initial data
	out = h0.Exec(nil, map[string]any{"z": 1, "y": nil}, nil)
	expectDeep(t, out.Data, map[string]any{"z": 1, "x": 4, "y": map[string]any{"id": "001"}, "qq": 2, "last": 99})

	// Error in task
	out = h0.Exec(map[string]any{"err0": true}, map[string]any{"z": 2}, nil)
	expectEqual(t, out.Err.Error(), "err0")

	// Operator names
	ops := h0.Operators()
	opNames := []string{}
	for _, name := range []string{"next", "skip", "stop", "merge", "lookup"} {
		if _, ok := ops[name]; ok {
			opNames = append(opNames, name)
		}
	}
	expectEqual(t, len(opNames), 5)

	// Error in operator
	out = h0.Exec(map[string]any{"err1": true}, nil, nil)
	expectEqual(t, out.Err.Error(), "err1")

	// Unknown operation
	out = h0.Exec(map[string]any{"err2": true}, nil, nil)
	expectEqual(t, out.Err.Error(), "Unknown operation: not-an-op")
}

func TestInsertOrder(t *testing.T) {
	h0 := New(nil)
	names := func() string {
		tasks := h0.Tasks()
		ns := make([]string, len(tasks))
		for i, t := range tasks {
			ns[i] = t.Name
		}
		return fmt.Sprintf("%s", joinStr(ns, " "))
	}

	h0.Add(&TaskDef{Name: "a"})
	expectEqual(t, names(), "a")

	h0.Add(&TaskDef{Name: "b"})
	expectEqual(t, names(), "a b")

	h0.Add(&TaskDef{Name: "c"})
	expectEqual(t, names(), "a b c")

	h0.Add(&TaskDef{Name: "A", Before: "a"})
	expectEqual(t, names(), "A a b c")

	h0.Add(&TaskDef{Name: "B", Before: "b"})
	expectEqual(t, names(), "A a B b c")

	h0.Add(&TaskDef{Name: "C", Before: "c"})
	expectEqual(t, names(), "A a B b C c")

	h0.Add(&TaskDef{Name: "a0", After: "a"})
	expectEqual(t, names(), "A a a0 B b C c")

	h0.Add(&TaskDef{Name: "b0", After: "b"})
	expectEqual(t, names(), "A a a0 B b b0 C c")

	h0.Add(&TaskDef{Name: "c0", After: "c"})
	expectEqual(t, names(), "A a a0 B b b0 C c c0")

	h0.Add(&TaskDef{Name: "A0", Before: "a"})
	expectEqual(t, names(), "A A0 a a0 B b b0 C c c0")

	h0.Add(&TaskDef{Name: "B0", Before: "b"})
	expectEqual(t, names(), "A A0 a a0 B B0 b b0 C c c0")

	h0.Add(&TaskDef{Name: "C0", Before: "c"})
	expectEqual(t, names(), "A A0 a a0 B B0 b b0 C C0 c c0")

	h0.Add(&TaskDef{Name: "a1", After: "a"})
	expectEqual(t, names(), "A A0 a a1 a0 B B0 b b0 C C0 c c0")

	h0.Add(&TaskDef{Name: "b1", After: "b"})
	expectEqual(t, names(), "A A0 a a1 a0 B B0 b b1 b0 C C0 c c0")

	h0.Add(&TaskDef{Name: "c1", After: "c"})
	expectEqual(t, names(), "A A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0")

	h0.Add(&TaskDef{Name: "A1", After: "A"})
	expectEqual(t, names(), "A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0")

	h0.Add(&TaskDef{Name: "AA0", Before: "A"})
	expectEqual(t, names(), "AA0 A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0")
}

func TestErrors(t *testing.T) {
	h0 := New(nil)

	h0.Add(&TaskDef{
		Name: "a",
		Exec: func(s *TaskSpec) *TaskReturn {
			return &TaskReturn{Err: errors.New("a-err")}
		},
	})

	out := h0.Exec(nil, nil, nil)
	expectEqual(t, out.Err.Error(), "a-err")

	h1 := New(nil)
	h1.Add(&TaskDef{
		Name: "a",
		Exec: func(s *TaskSpec) *TaskReturn {
			panic(errors.New("a-terr"))
		},
	})

	out = h1.Exec(nil, nil, nil)
	expectEqual(t, out.Err.Error(), "a-terr")
}

func TestDirect(t *testing.T) {
	h0 := New(nil)

	h0.AddExec("", func(s *TaskSpec) *TaskReturn {
		foo := s.Data["foo"].(map[string]any)
		foo["x"] = 1
		return nil
	})

	h0.AddExec("", func(s *TaskSpec) *TaskReturn {
		foo := s.Data["foo"].(map[string]any)
		foo["y"] = 2
		return nil
	})

	foo := map[string]any{"z": 0}
	o0 := h0.Exec(nil, map[string]any{"foo": foo}, nil)
	expectDeep(t, foo, map[string]any{"z": 0, "x": 1, "y": 2})
	expectDeep(t, o0.Data["foo"].(map[string]any), map[string]any{"z": 0, "x": 1, "y": 2})
}

func TestEdges(t *testing.T) {
	h0 := New(nil)

	o0 := h0.Exec(nil, nil, nil)
	expectEqual(t, len(o0.TaskLog), 0)
	expectEqual(t, o0.TaskCount, 0)
	expectEqual(t, o0.TaskTotal, 0)

	h0.SetOperator("foo", func(r *TaskResult, ctx, data map[string]any) (*Operate, error) {
		return nil, errors.New("foo")
	})
	h0.AddExec("", func(s *TaskSpec) *TaskReturn {
		return &TaskReturn{Op: "foo"}
	})
	o1 := h0.Exec(nil, nil, nil)
	expectEqual(t, o1.Err.Error(), "foo")
}

func TestDeepSync(t *testing.T) {
	r0 := New(nil)

	f0 := func(s *TaskSpec) *TaskReturn {
		s.Data["f0"] = 0
		return nil
	}

	f1 := func(s *TaskSpec) *TaskReturn {
		s.Data["f1"] = 1
		return nil
	}

	g0 := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		g := s.Data["g"].([]any)
		s.Data["g"] = append(g, v["x"])
		return nil
	}

	g1 := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		g := s.Data["g"].([]any)
		x, _ := v["x"].(int)
		s.Data["g"] = append(g, x*2)
		return nil
	}

	r0.Add(
		&TaskDef{Name: "f0", Exec: f0},
		&TaskDef{
			Name:   "select-list0",
			Select: "list0",
			Apply: []*TaskDef{
				{Name: "g0", Exec: g0},
				{Name: "g1", Exec: g1},
			},
		},
		&TaskDef{Name: "f1", Exec: f1},
	)

	d0 := map[string]any{
		"list0": []any{
			map[string]any{"x": 0},
			map[string]any{"x": 1},
		},
		"g": []any{},
	}

	o0 := r0.Exec(nil, d0, nil)

	expectDeep(t, o0.Data["g"], []any{0, 0, 1, 2})
	expectEqual(t, o0.Data["f0"], 0)
	expectEqual(t, o0.Data["f1"], 1)
}

func TestDeepLevels(t *testing.T) {
	r0 := New(nil)

	collect := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		n := s.Data["n"].([]any)
		s.Data["n"] = append(n, v["n"])
		return nil
	}

	r0.Add(&TaskDef{
		Name:   "outer",
		Select: "x",
		Apply: []*TaskDef{
			{
				Name:   "inner",
				Select: "",
				Apply:  []*TaskDef{{Name: "collect", Exec: collect}},
			},
		},
	})

	d0 := map[string]any{
		"x": map[string]any{
			"x0": map[string]any{
				"y0": map[string]any{"n": 0},
				"y1": map[string]any{"n": 1},
			},
			"x1": map[string]any{
				"y0": map[string]any{"n": 2},
				"y1": map[string]any{"n": 3},
			},
		},
		"n": []any{},
	}

	o0 := r0.Exec(nil, d0, nil)
	n := o0.Data["n"].([]any)
	expectEqual(t, len(n), 4)
}

func TestDeepCustom(t *testing.T) {
	r0 := New(nil)

	collect := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		n := s.Data["n"].([]any)
		s.Data["n"] = append(n, v["n"])
		return nil
	}

	r0.Add(&TaskDef{
		Name: "custom",
		Select: SelectFunc(func(source map[string]any, s *TaskSpec) any {
			x := source["x"].(map[string]any)
			return x["x1"]
		}),
		Apply: []*TaskDef{{Name: "collect", Exec: collect}},
	})

	d0 := map[string]any{
		"x": map[string]any{
			"x0": map[string]any{
				"y0": map[string]any{"n": 0},
				"y1": map[string]any{"n": 1},
			},
			"x1": map[string]any{
				"y0": map[string]any{"n": 2},
				"y1": map[string]any{"n": 3},
			},
		},
		"n": []any{},
	}

	o0 := r0.Exec(nil, d0, nil)
	n := o0.Data["n"].([]any)
	expectEqual(t, len(n), 2)
}

func TestDeepSort(t *testing.T) {
	sortDir := 1
	r0 := New(&Options{
		Select: SelectOptions{Sort: &sortDir},
	})

	g0 := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		g := s.Data["g"].([]any)
		s.Data["g"] = append(g, v["x"])
		return nil
	}

	g1 := func(s *TaskSpec) *TaskReturn {
		v := s.Node.Val.(map[string]any)
		g := s.Data["g"].([]any)
		x, _ := v["x"].(int)
		s.Data["g"] = append(g, x*2)
		return nil
	}

	r0.Add(
		&TaskDef{Name: "f0", Exec: func(s *TaskSpec) *TaskReturn {
			s.Data["f0"] = 0
			return nil
		}},
		&TaskDef{
			Name:   "select-map0",
			Select: "map0",
			Apply: []*TaskDef{
				{Name: "g0", Exec: g0},
				{Name: "g1", Exec: g1},
			},
		},
		&TaskDef{Name: "f1", Exec: func(s *TaskSpec) *TaskReturn {
			s.Data["f1"] = 1
			return nil
		}},
	)

	d0 := map[string]any{
		"map0": map[string]any{
			"b": map[string]any{"x": 1},
			"a": map[string]any{"x": 0},
		},
		"g": []any{},
	}

	o0 := r0.Exec(nil, d0, nil)

	expectDeep(t, o0.Data["g"], []any{0, 0, 1, 2})
	expectEqual(t, o0.Data["f0"], 0)
	expectEqual(t, o0.Data["f1"], 1)
}

func TestErrorCapture(t *testing.T) {
	r0 := New(nil)

	r0.Add(
		&TaskDef{Name: "f0", Exec: func(s *TaskSpec) *TaskReturn {
			s.Data["f0"] = 0
			return nil
		}},
		&TaskDef{Name: "f1", Exec: func(s *TaskSpec) *TaskReturn {
			panic(errors.New("f1"))
		}},
		&TaskDef{Name: "f2", Exec: func(s *TaskSpec) *TaskReturn {
			s.Data["f2"] = 1
			return nil
		}},
	)

	o0 := r0.Exec(nil, map[string]any{}, nil)
	expectEqual(t, o0.Err.Error(), "f1")
}

// Test helpers

func expectEqual(t *testing.T, got, want any) {
	t.Helper()
	if fmt.Sprintf("%v", got) != fmt.Sprintf("%v", want) {
		t.Errorf("expected %v, got %v", want, got)
	}
}

func expectDeep(t *testing.T, got, want any) {
	t.Helper()
	if fmt.Sprintf("%v", got) != fmt.Sprintf("%v", want) {
		t.Errorf("expected %v, got %v", want, got)
	}
}

func expectDeepStr(t *testing.T, got, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Errorf("length mismatch: expected %d, got %d\nexpected: %v\ngot:      %v", len(want), len(got), want, got)
		return
	}
	for i := range got {
		if got[i] != want[i] {
			t.Errorf("index %d: expected %q, got %q", i, want[i], got[i])
		}
	}
}

func joinStr(ss []string, sep string) string {
	result := ""
	for i, s := range ss {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
