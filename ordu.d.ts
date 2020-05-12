export { Self as Ordu, LegacyOrdu };
interface Ordu {
    add(t: TaskDef): void;
    tasks(): Task[];
}
interface TaskDef {
    id?: string;
    name?: string;
    before?: string | string[];
    after?: string | string[];
    exec?: (s: Spec) => any;
    from?: object;
    if?: {
        [k: string]: any;
    };
}
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
declare class Self implements Ordu {
    topo: {
        add(t: Task, _: any): void;
        nodes: Task[];
    };
    operator_map: {
        [op: string]: Operator;
    };
    constructor();
    operator(name: string, opr: Operator): void;
    operators(): {
        [op: string]: Operator;
    };
    add(taskdef: TaskDef): void;
    exec(ctx: any, data: any): Promise<ExecResult>;
    tasks(): Task[];
    operate(r: TaskResult, ctx: any, data: object): Operate;
    private task_if;
}
declare function LegacyOrdu(opts?: any): any;
