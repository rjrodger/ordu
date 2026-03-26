"use strict";
/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ordu_1 = require("../dist/ordu");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
(0, node_test_1.describe)('ordu', function () {
    (0, node_test_1.it)('sanity', async () => {
        const h0 = new ordu_1.Ordu();
        node_assert_1.default.ok(h0 != null);
    });
    (0, node_test_1.it)('happy', async () => {
        const h0 = new ordu_1.Ordu();
        h0.add((spec) => ({
            op: 'merge',
            out: {
                y: spec.data.x * 10,
            },
        }));
        let o0 = await h0.exec({}, { x: 11 }, {});
        node_assert_1.default.deepStrictEqual(o0.data, { x: 11, y: 110 });
        let o1 = await h0.exec({}, { x: 22 }, {});
        node_assert_1.default.deepStrictEqual(o1.data, { x: 22, y: 220 });
        h0.add((spec) => ({
            op: 'merge',
            out: {
                z: spec.data.y / 100,
            },
        }));
        let o2 = await h0.exec({}, { x: 33 }, {});
        node_assert_1.default.deepStrictEqual(o2.data, { x: 33, y: 330, z: 3.3 });
        // let o3 = h0.execSync({},{x:33})
        // assert.deepStrictEqual(o3.data, {x:33, y:330, z:3.3})
    });
    (0, node_test_1.it)('basic', async () => {
        let ts = ordu_1.Task.count - 1;
        const h0 = new ordu_1.Ordu();
        const taskresult_log = [];
        const taskend_log = [];
        h0.on('task-result', (tr) => {
            taskresult_log.push(tr);
        });
        h0.on('task-end', (ev) => {
            taskend_log.push(ev);
        });
        h0.add({
            name: 'A',
            // from: 'my-ref-01',
            meta: {
                from: { foo: 1 },
            },
        });
        h0.add({
            name: 'B',
            active: false,
            meta: null,
        });
        h0.add({
            exec: (spec) => {
                if (spec.ctx.err0) {
                    throw new Error('err0');
                }
                if (spec.ctx.err2) {
                    return { op: 'not-an-op' };
                }
                return null;
            },
        });
        h0.add({
            id: '0',
            exec: () => ({
                op: 'merge',
                out: {
                    x: 2,
                },
                why: 'some-reason',
            }),
        });
        h0.add({
            if: {
                x: 4,
                xx: 40,
            },
            exec: () => ({
                op: 'merge',
                out: {
                    q: 1,
                },
            }),
        });
        h0.add({
            name: 'a',
            exec: async () => {
                return new Promise((r) => setTimeout(() => {
                    r({
                        op: 'merge',
                        // out missing!
                    });
                }, 10));
            },
        });
        h0.add(function b() {
            return {
                op: 'merge',
                out: {
                    x: 4,
                },
            };
        });
        h0.add(function c() {
            return {
                op: 'lookup',
                out: {
                    id: '001',
                },
            };
        });
        h0.add({
            if: {
                x: 4,
            },
            exec: () => ({
                op: 'merge',
                out: {
                    qq: 2,
                },
            }),
        }).add({
            exec: () => ({
                op: 'stop',
                out: {
                    last: 99,
                },
            }),
        });
        h0.add({
            exec: () => ({
                op: 'merge',
                out: {
                    'should-never-be-reached': true,
                },
            }),
        });
        h0.add(() => { });
        let tI = ts;
        node_assert_1.default.deepStrictEqual(Object.keys(h0.task).map((tn) => tn + '~' + ('function' === typeof h0.task[tn].exec)), [
            'A~true',
            'B~true',
            `task${++tI}~true`,
            `task${++tI}~true`,
            `task${++tI}~true`,
            'a~true',
            'b~true',
            'c~true',
            `task${++tI}~true`,
            `task${++tI}~true`,
            `task${++tI}~true`,
            `task${++tI}~true`,
        ]);
        h0.operator('lookup', (async (tr, ctx, data) => {
            if (ctx.err1)
                throw new Error('err1');
            return new Promise((r) => {
                setTimeout(() => {
                    data.y = tr.out;
                    r({ stop: false });
                }, 10);
            });
        }));
        h0.operator(function does_nothing(tr, ctx, data) {
            return { stop: false };
        });
        node_assert_1.default.strictEqual(h0.tasks().length, 12);
        let out = await h0.exec();
        node_assert_1.default.deepStrictEqual(out.data, { x: 4, y: { id: '001' }, qq: 2, last: 99 });
        node_assert_1.default.strictEqual(out.taskcount, 8);
        node_assert_1.default.strictEqual(out.tasktotal, 12);
        tI = ts;
        node_assert_1.default.deepStrictEqual(taskresult_log.map((te) => te.name + '~' + te.op), [
            'A~next',
            'B~skip',
            `task${++tI}~next`,
            `task${++tI}~merge`,
            `task${++tI}~skip`,
            'a~merge',
            'b~merge',
            'c~lookup',
            `task${++tI}~merge`,
            `task${++tI}~stop`,
        ]);
        tI = ts;
        node_assert_1.default.deepStrictEqual(taskend_log.map((te) => te.name + '~' + te.op + '~' + te.operate.stop), [
            'A~next~false',
            'B~skip~false',
            `task${++tI}~next~false`,
            `task${++tI}~merge~false`,
            `task${++tI}~skip~false`,
            'a~merge~false',
            'b~merge~false',
            'c~lookup~false',
            `task${++tI}~merge~false`,
            `task${++tI}~stop~true`,
        ]);
        out = await h0.exec({}, { z: 1, y: null }, {});
        node_assert_1.default.deepStrictEqual(out.data, { z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 });
        node_assert_1.default.strictEqual(out.taskcount, 8);
        node_assert_1.default.strictEqual(out.tasktotal, 12);
        out = await h0.exec({ err0: true }, { z: 2 }, {});
        node_assert_1.default.strictEqual(out.err.message, 'err0');
        let operators = h0.operators();
        node_assert_1.default.deepStrictEqual(Object.keys(operators), [
            'next',
            'skip',
            'stop',
            'merge',
            'lookup',
            'does_nothing',
        ]);
        tI = ts;
        node_assert_1.default.deepStrictEqual(h0.tasks().map((t) => t.name), [
            'A',
            'B',
            `task${++tI}`,
            `task${++tI}`,
            `task${++tI}`,
            'a',
            'b',
            'c',
            `task${++tI}`,
            `task${++tI}`,
            `task${++tI}`,
            `task${++tI}`,
        ]);
        out = await h0.exec({ err1: true }, {}, { runid: 'foo' });
        node_assert_1.default.strictEqual(out.err.message, 'err1');
        out = await h0.exec({ err2: true }, {}, {
            done: function (rout) {
                node_assert_1.default.strictEqual(rout.err.message, 'Unknown operation: not-an-op');
            },
        });
        node_assert_1.default.strictEqual(out.err.message, 'Unknown operation: not-an-op');
    });
    (0, node_test_1.it)('async', async () => {
        const h0 = new ordu_1.Ordu({ debug: true });
        const taskresult_log = [];
        const taskend_log = [];
        h0.on('task-result', (tr) => {
            taskresult_log.push(tr);
        });
        h0.on('task-end', (ev) => {
            taskend_log.push(ev);
        });
        function foo() {
            return { op: 'merge', out: { foo: 1 } };
        }
        function bar() {
            return new Promise((r) => setTimeout(() => r({ op: 'merge', out: { bar: 1 } }), 10));
        }
        // async function zed() {
        function zed() {
            return new Promise((r) => setTimeout(() => r({ op: 'merge', out: { zed: 1 } }), 10));
        }
        async function qaz_impl() {
            return new Promise((r) => setTimeout(() => r({ op: 'merge', out: { qaz: 1 } }), 10));
        }
        async function qaz() {
            return await qaz_impl();
        }
        async function ext0(x) {
            return new Promise((r) => setTimeout(() => r('ext0-' + x), 10));
        }
        function a_ext0() {
            const ext0p = ext0('a');
            return { op: 'merge', out: { ext0p: ext0p } };
        }
        async function b_ext0(spec) {
            const ext0r = await spec.data.ext0p;
            return { op: 'merge', out: { ext0r: ext0r } };
        }
        function ext1(x, cb) {
            setTimeout(() => cb(null, 'ext1-' + x), 10);
        }
        function a_ext1() {
            return new Promise((r) => {
                ext1('a', function (err, out) {
                    r({ op: 'merge', out: { ext1r: out } });
                });
            });
        }
        h0.add({ name: 'foo', exec: foo, meta: {} });
        h0.add([bar, zed, { name: 'qaz', exec: qaz, meta: { from: 'second' } }]);
        h0.add(a_ext0);
        h0.add(b_ext0);
        h0.add(a_ext1);
        let out = await h0.exec();
        node_assert_1.default.ok(out.err == null);
        const data = out.data;
        node_assert_1.default.strictEqual(data.foo, 1);
        node_assert_1.default.strictEqual(data.bar, 1);
        node_assert_1.default.strictEqual(data.zed, 1);
        node_assert_1.default.strictEqual(data.qaz, 1);
        node_assert_1.default.strictEqual(data.ext0r, 'ext0-a');
        node_assert_1.default.strictEqual(data.ext1r, 'ext1-a');
        node_assert_1.default.ok(data.ext0p != null);
    });
    (0, node_test_1.it)('insert-order', async () => {
        const h0 = new ordu_1.Ordu();
        const names = (h0) => h0
            .tasks()
            .map((t) => t.name)
            .join(' ');
        h0.add(function a() { });
        node_assert_1.default.strictEqual(names(h0), 'a');
        h0.add(function b() { });
        node_assert_1.default.strictEqual(names(h0), 'a b');
        h0.add(function c() { });
        node_assert_1.default.strictEqual(names(h0), 'a b c');
        h0.add(function A() { }, { before: 'a' });
        node_assert_1.default.strictEqual(names(h0), 'A a b c');
        h0.add(function B() { }, { before: 'b' });
        node_assert_1.default.strictEqual(names(h0), 'A a B b c');
        h0.add(function C() { }, { before: 'c' });
        node_assert_1.default.strictEqual(names(h0), 'A a B b C c');
        h0.add(function a0() { }, { after: 'a' });
        node_assert_1.default.strictEqual(names(h0), 'A a a0 B b C c');
        h0.add(function b0() { }, { after: 'b' });
        node_assert_1.default.strictEqual(names(h0), 'A a a0 B b b0 C c');
        h0.add(function c0() { }, { after: 'c' });
        node_assert_1.default.strictEqual(names(h0), 'A a a0 B b b0 C c c0');
        h0.add(function A0() { }, { before: 'a' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a0 B b b0 C c c0');
        h0.add(function B0() { }, { before: 'b' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a0 B B0 b b0 C c c0');
        h0.add(function C0() { }, { before: 'c' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a0 B B0 b b0 C C0 c c0');
        h0.add(function a1() { }, { after: 'a' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b0 C C0 c c0');
        h0.add(function b1() { }, { after: 'b' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b1 b0 C C0 c c0');
        h0.add(function c1() { }, { after: 'c' });
        node_assert_1.default.strictEqual(names(h0), 'A A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0');
        h0.add(function A1() { }, { after: 'A' });
        node_assert_1.default.strictEqual(names(h0), 'A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0');
        h0.add(function AA0() { }, { before: 'A' });
        node_assert_1.default.strictEqual(names(h0), 'AA0 A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0');
    });
    (0, node_test_1.it)('errors', async () => {
        const h0 = new ordu_1.Ordu();
        h0.add(function a() {
            return {
                err: new Error('a-err'),
            };
        });
        let out = await h0.exec();
        node_assert_1.default.strictEqual(out.err.message, 'a-err');
        let cbout;
        await h0.exec({}, {}, {
            done: function (rout) {
                cbout = rout;
            },
        });
        await new Promise((r) => setImmediate(() => {
            node_assert_1.default.strictEqual(cbout.err.message, 'a-err');
            r();
        }));
        const h1 = new ordu_1.Ordu();
        h1.add(function a() {
            throw new Error('a-terr');
        });
        let h1out = await h1.exec();
        node_assert_1.default.strictEqual(h1out.err.message, 'a-terr');
        let h1cbout;
        await h1.exec({}, {}, {
            done: function (rout) {
                h1cbout = rout;
            },
        });
        await new Promise((r) => setImmediate(() => {
            node_assert_1.default.strictEqual(h1cbout.err.message, 'a-terr');
            r();
        }));
    });
    (0, node_test_1.it)('direct', async () => {
        const h0 = new ordu_1.Ordu();
        h0.add((spec) => {
            spec.data.foo.x = 1;
        });
        h0.add((spec) => {
            spec.data.foo.y = 2;
        });
        let foo = { z: 0 };
        let o0 = h0.execSync({}, { foo }, {});
        node_assert_1.default.deepStrictEqual(foo, { z: 0, x: 1, y: 2 });
        node_assert_1.default.deepStrictEqual(o0.data.foo, { z: 0, x: 1, y: 2 });
    });
    (0, node_test_1.it)('edges', async () => {
        const h0 = new ordu_1.Ordu();
        let o0 = h0.execSync();
        node_assert_1.default.deepStrictEqual(o0.tasklog, []);
        node_assert_1.default.strictEqual(o0.taskcount, 0);
        node_assert_1.default.strictEqual(o0.tasktotal, 0);
        let o1 = await h0.exec();
        node_assert_1.default.deepStrictEqual(o1.tasklog, []);
        node_assert_1.default.strictEqual(o1.taskcount, 0);
        node_assert_1.default.strictEqual(o1.tasktotal, 0);
        h0.operator('foo', (tr, ctx, data) => {
            throw new Error('foo');
        });
        h0.add(() => ({ op: 'foo' }));
        let o2 = h0.execSync();
        node_assert_1.default.strictEqual(o2.err.message, 'foo');
        const h1 = new ordu_1.Ordu();
        h1.add(async () => {
            throw new Error('bar');
        });
        let o3 = await h1.exec();
        node_assert_1.default.strictEqual(o3.err.message, 'bar');
    });
    (0, node_test_1.it)('readme', async () => {
        let process = new ordu_1.Ordu();
        process.add(function first(spec) {
            if (null == spec.data.foo) {
                return { op: 'stop', err: new Error('no foo') };
            }
            spec.data.foo = spec.data.foo.toUpperCase() + spec.ctx.suffix;
            // Default is to continue to next step.
        });
        const ctx = { suffix: '!!!' };
        let data = { foo: 'green' };
        process.execSync(ctx, data, {});
        // DOC console.log(data.foo) // prints 'GREEN!!!' (first)
        node_assert_1.default.deepStrictEqual(data, { foo: 'GREEN!!!' });
        process.add(function second(spec) {
            spec.data.foo = spec.ctx.prefix + spec.data.foo;
        });
        ctx.prefix = '>>>';
        data = { foo: 'blue' };
        process.execSync(ctx, data, {});
        // DOC console.log(data.foo) // prints '>>>BLUE!!!' (first, second)
        node_assert_1.default.deepStrictEqual(data, { foo: '>>>BLUE!!!' });
    });
});
//# sourceMappingURL=ordu.test.js.map