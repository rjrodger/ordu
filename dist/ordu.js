/* Copyright (c) 2016-2021 Richard Rodger and other contributors, MIT License */
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyOrdu = exports.Task = exports.Ordu = void 0;
/* $lab:coverage:on$ */
const events_1 = require("events");
const Hoek = __importStar(require("@hapi/hoek"));
const nua_1 = __importDefault(require("nua"));
class Task {
    constructor(taskdef) {
        var _a;
        this.runid =
            null == taskdef.id ? ('' + Math.random()).substring(2) : taskdef.id;
        this.name = taskdef.name || 'task' + Task.count++;
        this.before = taskdef.before;
        this.after = taskdef.after;
        this.exec = taskdef.exec || ((_) => { });
        this.if = taskdef.if || void 0;
        this.active = null == taskdef.active ? true : taskdef.active;
        this.meta = Object.assign(taskdef.meta || {}, {
            when: Date.now(),
            from: (_a = taskdef.meta) === null || _a === void 0 ? void 0 : _a.from,
        });
    }
}
exports.Task = Task;
Task.count = 0;
// Use the constructor to normalize task result
class TaskResult {
    constructor(task, taskI, total, runid) {
        this.op = 'not-defined';
        this.task = task;
        this.name = task.name;
        this.start = Date.now();
        this.end = Number.MAX_SAFE_INTEGER;
        this.index = taskI;
        this.total = total;
        this.async = false;
        this.runid = runid;
    }
    update(raw) {
        raw = null == raw ? {} : raw;
        this.out = null == raw.out ? {} : raw.out;
        this.err = raw instanceof Error ? raw : raw.err;
        this.op =
            null != this.err ? 'stop' : 'string' === typeof raw.op ? raw.op : 'next';
        this.why = raw.why || '';
    }
}
class Ordu extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.task = {};
        this._opts = {
            debug: false,
            ...opts,
        };
        this._tasks = [];
        this._operator_map = {
            next: () => ({ stop: false }),
            skip: () => ({ stop: false }),
            stop: (tr, _, data) => {
                (0, nua_1.default)(data, tr.out, { preserve: true });
                return { stop: true, err: tr.err };
            },
            merge: (tr, _, data) => {
                (0, nua_1.default)(data, tr.out, { preserve: true });
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
        let callpoint;
        if (this._opts.debug) {
            callpoint = make_callpoint(new Error());
        }
        if ('function' == typeof first) {
            second = second || {};
            let t = second;
            t.exec = first;
            t.name = first.name ? first.name : t.name;
            this._add_task(t, callpoint);
        }
        else if (Array.isArray(first)) {
            for (var i = 0; i < first.length; i++) {
                let entry = first[i];
                if ('function' === typeof first[i]) {
                    entry = { name: first[i].name, exec: first[i] };
                }
                this._add_task(entry, callpoint);
            }
        }
        else {
            this._add_task(first, callpoint);
        }
        return this;
    }
    _add_task(td, callpoint) {
        if (callpoint) {
            td.meta = td.meta || {};
            td.meta.from = Object.assign(td.meta.from || {}, {
                callpoint$: callpoint,
            });
        }
        let t = new Task(td);
        let tI = 0;
        for (; tI < this._tasks.length; tI++) {
            if (null != t.before && this._tasks[tI].name === t.before) {
                break;
            }
            else if (null != t.after && this._tasks[tI].name === t.after) {
                tI++;
                break;
            }
        }
        this._tasks.splice(tI, 0, t);
        this.task[t.name] = t;
    }
    execSync(ctx, data, opts) {
        return this._execImpl(ctx, data, opts);
    }
    async exec(ctx, data, opts) {
        return new Promise((resolve) => {
            this._execImpl(ctx, data, opts, resolve);
        });
    }
    _execImpl(ctx, data, opts, resolve) {
        const self = this;
        opts = null == opts ? {} : opts;
        let runid = opts.runid || (Math.random() + '').substring(2);
        let start = Date.now();
        let tasks = [...self._tasks];
        let spec = {
            ctx: ctx || {},
            data: data || {},
        };
        let tasklog = [];
        let taskcount = 0;
        let last_taskI = 0;
        let last_operate = undefined;
        return next(0);
        function next(taskI) {
            if (taskI >= tasks.length) {
                let execres = finish();
                return resolve ? resolve(execres) : execres;
            }
            last_taskI = taskI;
            let task = tasks[taskI];
            let execres;
            let taskout;
            let result = new TaskResult(task, taskI, tasks.length, runid);
            if (task.active && self._task_if(task, spec.data)) {
                try {
                    taskcount++;
                    let taskspec = Object.assign({ task: task }, spec);
                    execres = task.exec(taskspec);
                    if (execres instanceof Promise) {
                        result.async = true;
                        execres
                            .then((out) => (taskout = out))
                            .catch((err) => (taskout = err))
                            .finally(() => handle_result(taskI, task, taskout, result));
                    }
                    else {
                        taskout = execres;
                    }
                }
                catch (task_ex) {
                    taskout = task_ex;
                }
            }
            else {
                taskout = { op: 'skip' };
            }
            if (!result.async) {
                return handle_result(taskI, task, taskout, result);
            }
        }
        function handle_result(taskI, task, taskout, result) {
            result.end = Date.now();
            result.update(taskout);
            self.emit('task-result', result);
            let operate = {
                stop: false,
                err: undefined,
                async: false,
            };
            try {
                let opres = self._operate(result, spec.ctx, spec.data);
                if (opres instanceof Promise) {
                    operate.async = true;
                    opres
                        .then((out) => {
                        Object.assign(operate, out);
                    })
                        .catch((err) => {
                        operate.stop = true;
                        operate.err = err;
                    })
                        .finally(() => {
                        handle_operate(taskI, task, result, operate);
                    });
                }
                else {
                    operate = opres;
                    operate.async = false;
                }
            }
            catch (operate_ex) {
                operate.stop = true;
                operate.err = operate_ex;
            }
            if (!operate.async) {
                return handle_operate(taskI, task, result, operate);
            }
        }
        function handle_operate(taskI, task, result, operate) {
            last_operate = operate;
            let entry = {
                name: task.name,
                op: result.op,
                task,
                result,
                operate,
                data: self._opts.debug ? JSON.parse(JSON.stringify(spec.data)) : void 0,
            };
            tasklog.push(entry);
            self.emit('task-end', entry);
            if (!operate.stop) {
                ++taskI;
            }
            else {
                taskI = tasks.length;
            }
            return next(taskI);
        }
        function finish() {
            let err = last_operate ? last_operate.err : null;
            let execres = {
                tasklog: tasklog,
                task: err ? tasks[last_taskI] : void 0,
                taskcount: taskcount,
                tasktotal: tasks.length,
                start: start,
                end: Date.now(),
                err: err,
                data: spec.data,
            };
            if (opts.done) {
                opts.done(execres);
            }
            return execres;
        }
    }
    tasks() {
        return [...this._tasks];
    }
    _operate(r, ctx, data) {
        if (r.err) {
            return {
                stop: true,
                err: r.err,
                async: false,
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
                async: false,
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
/* $lab:coverage:off$ */
function make_callpoint(err) {
    return null == err
        ? []
        : (err.stack || '')
            .split(/\n/)
            .slice(4)
            .map((line) => line.substring(4));
}
/* $lab:coverage:on$ */
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