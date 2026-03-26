"use strict";
/* Copyright (c) 2016-2020 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ordu_1 = require("../dist/ordu");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const Ordu = ordu_1.LegacyOrdu;
(0, node_test_1.describe)('ordu-legacy', function () {
    (0, node_test_1.it)('construct', async () => {
        const w = Ordu();
        node_assert_1.default.ok(w != null);
        const wn = ('' + w).replace(/ordu\d+/g, 'ordu0');
        node_assert_1.default.strictEqual(wn, 'ordu0:[]');
    });
    (0, node_test_1.it)('readme-example', async () => {
        const w = Ordu();
        w.add(function first(ctxt, data) {
            if (null == data.foo) {
                return { kind: 'error', why: 'no foo' };
            }
            data.foo = data.foo.substring(0, ctxt.len);
        });
        w.add({ tags: ['upper'] }, function second(_ctxt, data) {
            data.foo = data.foo.toUpperCase();
        });
        const ctxt = { len: 3 };
        let data = { foo: 'green' };
        w.process(ctxt, data);
        node_assert_1.default.strictEqual(data.foo, 'GRE');
        // console.log(data.foo) // prints 'GRE' (first, second)
        data = { foo: 'blue' };
        w.process({ tags: ['upper'] }, ctxt, data);
        // console.log(data.foo) // prints 'BLUE' (second)
        node_assert_1.default.strictEqual(data.foo, 'BLUE');
        data = [];
        const res = w.process(ctxt, data);
        // console.log(res) // prints {kind: 'error', why: 'no foo', ... introspection ...}
        node_assert_1.default.deepStrictEqual(res, {
            ctxt$: {
                index$: 0,
                taskname$: 'first',
                len: 3,
            },
            data$: [],
            index$: 0,
            taskname$: 'first',
            kind: 'error',
            why: 'no foo',
        });
    });
    (0, node_test_1.it)('happy', async () => {
        const w = Ordu();
        w.add(function (ctxt, data) {
            data.x = 1;
        });
        const ctxt = {};
        let data = {};
        node_assert_1.default.ok(data.x == null);
        let res = w.process(ctxt, data);
        node_assert_1.default.ok(res == null);
        node_assert_1.default.strictEqual(data.x, 1);
        w.add(function failer(ctxt, data) {
            return { kind: 'error' };
        });
        data = {};
        res = w.process(ctxt, data);
        node_assert_1.default.strictEqual(data.x, 1);
        node_assert_1.default.strictEqual(res.kind, 'error');
        node_assert_1.default.strictEqual(res.index$, 1);
        node_assert_1.default.strictEqual(res.taskname$, 'failer');
        node_assert_1.default.strictEqual(res.ctxt$, ctxt);
        node_assert_1.default.strictEqual(res.data$, data);
        const wn = ('' + w).replace(/ordu\d+/g, 'ordu1');
        node_assert_1.default.strictEqual(wn, 'ordu1:[ordu1_task0,failer]');
    });
    (0, node_test_1.it)('list', async () => {
        const w = Ordu({ name: 'foo' });
        w.add(function zero() { })
            .add(function () { })
            .add(function two() { });
        node_assert_1.default.deepStrictEqual(w.tasknames(), ['zero', 'foo_task1', 'two']);
        node_assert_1.default.deepStrictEqual(w.taskdetails(), [
            'zero:{tags:}',
            'foo_task1:{tags:}',
            'two:{tags:}',
        ]);
        node_assert_1.default.strictEqual('' + w, 'foo:[zero,foo_task1,two]');
    });
    (0, node_test_1.it)('process', async () => {
        const w = Ordu({ name: 'tags' });
        w.add(function zero(c, d) {
            d.zero = true;
        });
        let data = {};
        node_assert_1.default.strictEqual(w.process(), null);
        node_assert_1.default.ok(data.zero == null);
        data = {};
        node_assert_1.default.strictEqual(w.process(data), null);
        node_assert_1.default.strictEqual(data.zero, true);
        data = {};
        node_assert_1.default.strictEqual(w.process({}, data), null);
        node_assert_1.default.strictEqual(data.zero, true);
        data = {};
        node_assert_1.default.strictEqual(w.process({}, {}, data), null);
        node_assert_1.default.strictEqual(data.zero, true);
    });
    (0, node_test_1.it)('tags', async () => {
        const w = Ordu({ name: 'tags' });
        w.add({ tags: ['red'] }, function zero(c, d) {
            d.push('zero');
        });
        w.add({ tags: [] }, function one(c, d) {
            d.push('one');
        });
        w.add(function two(c, d) {
            d.push('two');
        });
        let data = [];
        node_assert_1.default.strictEqual(w.process({}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['zero', 'one', 'two']);
        data = [];
        node_assert_1.default.strictEqual(w.process({ tags: ['red'] }, {}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['zero']);
        w.add({ tags: ['red', 'blue'] }, function three(c, d) {
            d.push('three');
        });
        data = [];
        node_assert_1.default.strictEqual(w.process({ tags: ['blue', 'red'] }, {}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['three']);
        data = [];
        node_assert_1.default.strictEqual(w.process({ tags: ['red'] }, {}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['zero', 'three']);
        data = [];
        node_assert_1.default.strictEqual(w.process({ tags: ['blue'] }, {}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['three']);
        data = [];
        node_assert_1.default.strictEqual(w.process({ tags: [] }, {}, data), null);
        node_assert_1.default.deepStrictEqual(data, ['zero', 'one', 'two', 'three']);
    });
});
//# sourceMappingURL=ordu-legacy.test.js.map