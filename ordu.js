/* Copyright (c) 2016-2020 Richard Rodger and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyOrdu = exports.Ordu = void 0;
/* $lab:coverage:on$ */
const events_1 = require("events");
const Hoek = __importStar(require("@hapi/hoek"));
const Topo = __importStar(require("@hapi/topo"));
const nua_1 = __importDefault(require("nua"));
let Task = /** @class */ (() => {
    class Task {
        constructor(taskdef) {
            this.runid =
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
    return Task;
})();
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
class Ordu extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this._opts = {
            debug: false,
            ...opts
        };
        this._topo = new Topo.Sorter();
        this._operator_map = {
            next: () => ({ stop: false }),
            skip: () => ({ stop: false }),
            stop: (tr, _, data) => {
                nua_1.default(data, tr.out, { preserve: true });
                return { stop: true, err: tr.err };
            },
            merge: (tr, _, data) => {
                nua_1.default(data, tr.out, { preserve: true });
                return { stop: false };
            },
        };
    }
    operator(first, opr) {
        let name = 'string' === typeof first ? first : first.name;
        this._operator_map[name] = opr || first;
    }
    operators() {
        return this._operator_map;
    }
    add(first, second) {
        if ('function' == typeof first) {
            second = second || {};
            let t = new Task(second);
            t.exec = first;
            t.name = first.name ? first.name : t.name;
            this._add_task(t);
        }
        else if (Array.isArray(first)) {
            for (var i = 0; i < first.length; i++) {
                let entry = first[i];
                if ('function' === typeof first[i]) {
                    entry = { name: first[i].name, exec: first[i] };
                }
                this._add_task(entry);
            }
        }
        else {
            this._add_task(first);
        }
    }
    _add_task(td) {
        let t = new Task(td);
        this._topo.add(t, {
            group: t.name,
            before: t.before,
            after: t.after,
        });
    }
    // TODO: execSync version when promises not needed
    async exec(ctx, data, opts) {
        opts = null == opts ? {} : opts;
        let runid = opts.runid || (Math.random() + '').substring(2);
        let start = Date.now();
        let tasks = this._topo.nodes;
        let spec = {
            ctx: ctx || {},
            data: data || {},
        };
        let operate = {
            stop: false,
            err: void 0,
            async: false
        };
        let tasklog = [];
        let task_count = 0;
        let taskI = 0;
        for (; taskI < tasks.length; taskI++) {
            let task = tasks[taskI];
            let taskout = null;
            let tasklogentry = {
                task,
                runid,
                start: Date.now(),
                end: Number.MAX_SAFE_INTEGER,
                index: taskI,
                total: tasks.length,
                async: false
            };
            if (this._task_if(task, spec.data)) {
                try {
                    task_count++;
                    let taskspec = Object.assign({ task: task }, spec);
                    taskout = task.exec(taskspec);
                    if (taskout instanceof Promise) {
                        tasklogentry.async = true;
                        taskout = await taskout;
                    }
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
            this.emit('task-result', result);
            try {
                operate = this._operate(result, spec.ctx, spec.data);
                if (operate instanceof Promise) {
                    operate = (await operate);
                    operate.async = true;
                }
                else {
                    operate.async = false;
                }
                operate.err = operate.err || void 0;
            }
            catch (operate_ex) {
                operate = {
                    stop: true,
                    err: operate_ex,
                    async: false
                };
            }
            // TODO: fix debug double work
            tasklog.push({
                name: task.name,
                op: result.op,
                task,
                result,
                operate,
                data: this._opts.debug ? JSON.parse(JSON.stringify(spec.data)) : void 0
            });
            this.emit('task-end', {
                result,
                operate,
                data: this._opts.debug ? JSON.parse(JSON.stringify(spec.data)) : void 0
            });
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
        return this._topo.nodes;
    }
    _operate(r, ctx, data) {
        if (r.err) {
            return {
                stop: true,
                err: r.err,
                async: false
            };
        }
        let operator = this._operator_map[r.op];
        if (operator) {
            return operator(r, ctx, data);
        }
        else {
            return {
                stop: true,
                err: new Error('Unknown operation: ' + r.op),
                async: false
            };
        }
    }
    _task_if(task, data) {
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