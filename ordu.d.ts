export { Ordu, LegacyOrdu };
interface OrduIF {
    add(td: TaskDef): void;
    add(td: TaskDef[]): void;
    add(te: TaskExec): void;
    add(te: TaskExec, td: TaskDef): void;
    add(te: TaskExec[]): void;
    tasks(): Task[];
    operator(name: string, opr: Operator): void;
    operator(opr: Operator): void;
    operators(): object;
    exec(ctx: any, data: any, opts: any): Promise<ExecResult>;
}
interface TaskDef {
    id?: string;
    name?: string;
    before?: string | string[];
    after?: string | string[];
    exec?: TaskExec;
    from?: object;
    if?: {
        [k: string]: any;
    };
}
declare type TaskExec = (s: Spec) => any;
interface Spec {
    ctx: object;
    data: object;
}
declare class Task {
    static count: number;
    id: string;
    name: string;
    before: string[];
    after: string[];
    exec: (s: Spec) => TaskResult;
    if?: {
        [k: string]: any;
    };
    meta: {
        order: number;
        when: number;
        from: object;
    };
    constructor(taskdef: TaskDef);
}
declare type TaskLogEntry = {
    task: Task;
    start: number;
    end: number;
};
declare class TaskResult {
    op: string;
    out: object;
    err?: Error;
    log: TaskLogEntry;
    why: string;
    constructor(log: TaskLogEntry, raw: any);
}
declare type Operate = {
    stop: boolean;
    err?: Error;
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
declare class Ordu implements OrduIF {
    private topo;
    private operator_map;
    constructor();
    operator(first: string | Operator, opr?: Operator): void;
    operators(): {
        [op: string]: Operator;
    };
    add(first: any, second?: any): void;
    private add_task;
    exec(ctx: any, data: any, opts: any): Promise<ExecResult>;
    tasks(): Task[];
    private operate;
    private task_if;
}
declare function LegacyOrdu(opts?: any): any;
