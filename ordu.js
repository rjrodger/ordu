/* Copyright (c) 2016-2020 Richard Rodger and other contributors, MIT License */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Hoek = require("@hapi/hoek");
const Topo = require("@hapi/topo");
class Task {
    constructor(taskdef) {
        this.id =
            null == taskdef.id ? ('' + Math.random()).substring(2) : taskdef.id;
        this.name = taskdef.name || 'task' + Task.count;
        this.before = strarr(taskdef.before);
        this.after = strarr(taskdef.after);
        this.exec = taskdef.exec || ((_) => { });
        this.if = taskdef.if || void 0;
        this.meta = {
            order: Task.count++,
            when: Date.now(),
            // TODO: auto generate call point stacktrace?
            from: taskdef.from || {},
        };
    }
}
Task.count = 0;
// Use the constructor to normalize task result
class TaskResult {
    constructor(log, raw) {
        raw = null == raw ? {} : raw;
        this.log = log;
        this.out = null == raw.out ? {} : raw.out;
        this.err = raw instanceof Error ? raw : void 0;
        this.op =
            null != this.err ? 'stop' : 'string' === typeof raw.op ? raw.op : 'next';
        this.why = raw.why || '';
    }
}
class Ordu {
    constructor() {
        this.topo = new Topo.Sorter();
        this.operator_map = {
            next: () => ({ stop: false }),
            skip: () => ({ stop: false }),
            stop: (tr, _, data) => {
                Hoek.merge(data, tr.out);
                return { stop: true, err: tr.err };
            },
            merge: (tr, _, data) => {
                Hoek.merge(data, tr.out);
                return { stop: false };
            },
        };
    }
    operator(name, opr) {
        this.operator_map[name] = opr;
    }
    operators() {
        return this.operator_map;
    }
    // TODO: use https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions ?
    add(taskin, taskextra) {
        let t;
        if (Array.isArray(taskin)) {
            ;
            taskin.forEach((t) => this.add(t));
            return;
        }
        else if ('function' !== typeof taskin) {
            if (taskextra) {
                t = new Task(taskextra);
                t.exec = taskin;
                t.name = taskin.name ? taskin.name : t.name;
            }
            else {
                t = new Task(taskin);
            }
        }
        else {
            t = new Task({
                name: taskin.name,
                exec: taskin,
            });
        }
        this.topo.add(t, {
            group: t.name,
            before: t.before,
            after: t.after,
        });
    }
    // TODO: execSync version when promises not needed
    async exec(ctx, data, opts) {
        opts = null == opts ? {} : opts;
        let start = Date.now();
        let tasks = this.topo.nodes;
        let spec = {
            ctx: ctx || {},
            data: data || {},
        };
        let operate = { stop: false, err: void 0 };
        let tasklog = [];
        let task_count = 0;
        let taskI = 0;
        for (; taskI < tasks.length; taskI++) {
            let task = tasks[taskI];
            let taskout = null;
            let tasklogentry = {
                task,
                start: Date.now(),
                end: Number.MAX_SAFE_INTEGER,
            };
            if (this.task_if(task, spec.data)) {
                try {
                    task_count++;
                    taskout = task.exec(spec);
                    taskout = taskout instanceof Promise ? await taskout : taskout;
                }
                catch (task_ex) {
                    taskout = task_ex;
                }
            }
            else {
                taskout = { op: 'skip' };
            }
            tasklogentry.end = Date.now();
            let result = new TaskResult(tasklogentry, taskout);
            try {
                operate = this.operate(result, spec.ctx, spec.data);
                operate = (operate instanceof Promise
                    ? await operate
                    : operate);
            }
            catch (operate_ex) {
                operate = {
                    stop: true,
                    err: operate_ex,
                };
            }
            tasklog.push({ name: task.name, op: result.op, task, result, operate });
            if (operate.stop) {
                break;
            }
        }
        let execres = {
            tasklog: tasklog,
            task: operate.err ? tasks[taskI] : void 0,
            task_count: task_count,
            task_total: tasks.length,
            start: start,
            end: Date.now(),
            err: operate.err,
            data: spec.data,
        };
        if (opts.done) {
            opts.done(execres);
        }
        return execres;
    }
    tasks() {
        return this.topo.nodes;
    }
    operate(r, ctx, data) {
        if (r.err) {
            return {
                stop: true,
                err: r.err,
            };
        }
        let operator = this.operator_map[r.op];
        if (operator) {
            return operator(r, ctx, data);
        }
        else {
            return {
                stop: true,
                err: new Error('Unknown operation: ' + r.op),
            };
        }
    }
    task_if(task, data) {
        if (task.if) {
            let task_if = task.if;
            return Object.keys(task_if).reduce((proceed, k) => {
                let part = Hoek.reach(data, k);
                return (proceed &&
                    Hoek.contain({ $: part }, { $: task_if[k] }, { deep: true }));
            }, true);
        }
        else {
            return true;
        }
    }
}
exports.Ordu = Ordu;
function strarr(x) {
    return null == x ? [] : 'string' === typeof x ? [x] : x;
}
function LegacyOrdu(opts) {
    var orduI = -1;
    var self = {};
    ++orduI;
    opts = opts || {};
    opts.name = opts.name || 'ordu' + orduI;
    self.add = api_add;
    self.process = api_process;
    self.tasknames = api_tasknames;
    self.taskdetails = api_taskdetails;
    self.toString = api_toString;
    var tasks = [];
    function api_add(spec, task) {
        task = task || spec;
        if (!task.name) {
            Object.defineProperty(task, 'name', {
                value: opts.name + '_task' + tasks.length,
            });
        }
        task.tags = spec.tags || [];
        tasks.push(task);
        return self;
    }
    // Valid calls:
    //   * process(spec, ctxt, data)
    //   * process(ctxt, data)
    //   * process(data)
    //   * process()
    function api_process() {
        var i = arguments.length;
        var data = 0 < i && arguments[--i];
        var ctxt = 0 < i && arguments[--i];
        var spec = 0 < i && arguments[--i];
        data = data || {};
        ctxt = ctxt || {};
        spec = spec || {};
        spec.tags = spec.tags || [];
        for (var tI = 0; tI < tasks.length; ++tI) {
            var task = tasks[tI];
            if (0 < spec.tags.length && !contains(task.tags, spec.tags)) {
                continue;
            }
            var index$ = tI;
            var taskname$ = task.name;
            ctxt.index$ = index$;
            ctxt.taskname$ = taskname$;
            var res = task(ctxt, data);
            if (res) {
                res.index$ = index$;
                res.taskname$ = taskname$;
                res.ctxt$ = ctxt;
                res.data$ = data;
                return res;
            }
        }
        return null;
    }
    function api_tasknames() {
        return tasks.map(function (v) {
            return v.name;
        });
    }
    function api_taskdetails() {
        return tasks.map(function (v) {
            return v.name + ':{tags:' + v.tags + '}';
        });
    }
    function api_toString() {
        return opts.name + ':[' + self.tasknames() + ']';
    }
    return self;
}
exports.LegacyOrdu = LegacyOrdu;
function contains(all, some) {
    for (var i = 0; i < some.length; ++i) {
        if (-1 === all.indexOf(some[i])) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=ordu.js.map