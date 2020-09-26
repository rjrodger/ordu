/// <reference types="node" />
import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
export { Ordu, TaskDef, TaskSpec, LegacyOrdu };
interface Events {
    'task-result': TaskResult;
    'task-end': {
        result: TaskResult;
        operate: Operate;
        data: any;
    };
}
declare type OrduEmitter = StrictEventEmitter<EventEmitter, Events>;
interface OrduIF {
    add(td: TaskDef): OrduIF;
    add(td: TaskDef[]): OrduIF;
    add(te: TaskExec): OrduIF;
    add(te: TaskExec, td: TaskDef): OrduIF;
    add(te: TaskExec[]): OrduIF;
    tasks(): Task[];
    task: {
        [name: string]: Task;
    };
    operator(name: string, opr: Operator): void;
    operator(opr: Operator): void;
    operators(): object;
    exec(ctx: any, data: any, opts: any): Promise<ExecResult>;
}
interface TaskDef {
    id?: string;
    name?: string;
    before?: string;
    after?: string;
    exec?: TaskExec;
    from?: object;
    if?: {
        [k: string]: any;
    };
    active?: boolean;
    meta?: any;
}
declare type TaskExec = (s: TaskSpec) => any;
interface TaskSpec {
    ctx: any;
    data: any;
    task: Task;
}
declare class Task {
    static count: number;
    runid: string;
    name: string;
    before?: string;
    after?: string;
    exec: (s: TaskSpec) => TaskResult;
    if?: {
        [k: string]: any;
    };
    active?: boolean;
    meta: {
        when: number;
        from: object;
    };
    constructor(taskdef: TaskDef);
}
declare class TaskResult {
    op: string;
    out?: object;
    err?: Error;
    why?: string;
    task: Task;
    name: string;
    start: number;
    end: number;
    runid: string;
    index: number;
    total: number;
    async: boolean;
    constructor(task: Task, taskI: number, total: number, runid: string);
    update(raw: any): void;
}
declare type Operate = {
    stop: boolean;
    err?: Error;
    async?: boolean;
};
declare type ExecResult = {
    tasklog: any[];
    task?: Task;
    task_count: number;
    task_total: number;
    start: number;
    end: number;
    err?: Error;
    data: object;
};
declare type Operator = (r: TaskResult, ctx: any, data: object) => Operate;
declare const Ordu_base: new () => OrduEmitter;
declare class Ordu extends Ordu_base implements OrduIF {
    private _opts;
    private _tasks;
    private _operator_map;
    task: {
        [name: string]: Task;
    };
    constructor(opts?: any);
    operator(first: string | Operator, opr?: Operator): void;
    operators(): {
        [op: string]: Operator;
    };
    add(first: any, second?: any): Ordu;
    private _add_task;
    exec(ctx: any, data: any, opts: any): Promise<ExecResult>;
    tasks(): Task[];
    private _operate;
    private _task_if;
}
declare function LegacyOrdu(opts?: any): any;
