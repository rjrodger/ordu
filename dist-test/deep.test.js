"use strict";
/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ordu_1 = require("../dist/ordu");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
(0, node_test_1.describe)('deep', function () {
    (0, node_test_1.it)('basic-sync', async () => {
        const r0 = new ordu_1.Ordu();
        function f0(t) {
            t.data.f0 = 0;
        }
        function f1(t) {
            t.data.f1 = 1;
        }
        function g0(t) {
            t.data.g.push(t.node.val.x);
        }
        function g1(t) {
            t.data.g.push(t.node.val.x * 2);
        }
        const d0 = {
            list0: [
                { x: 0 },
                { x: 1 },
            ],
            g: []
        };
        r0.add([
            f0,
            {
                select: 'list0', apply: [
                    g0,
                    g1,
                ]
            },
            f1
        ]);
        const o0 = r0.execSync({}, d0);
        // console.dir(o0.data, { depth: null })
        node_assert_1.default.deepStrictEqual(o0.data, { list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 });
    });
    (0, node_test_1.it)('basic-async', async () => {
        const r0 = new ordu_1.Ordu();
        async function f0(t) {
            await new Promise((r) => setTimeout(r, 11));
            t.data.f0 = 0;
        }
        async function f1(t) {
            await new Promise((r) => setTimeout(r, 11));
            t.data.f1 = 1;
        }
        async function g0(t) {
            await new Promise((r) => setTimeout(r, 11));
            t.data.g.push(t.node.val.x);
        }
        async function g1(t) {
            await new Promise((r) => setTimeout(r, 11));
            t.data.g.push(t.node.val.x * 2);
        }
        const d0 = {
            list0: [
                { x: 0 },
                { x: 1 },
            ],
            g: []
        };
        r0.add([
            f0,
            {
                select: 'list0', apply: [
                    g0,
                    g1,
                ]
            },
            f1
        ]);
        const o0 = await r0.exec({}, d0);
        // console.dir(o0.data, { depth: null })
        node_assert_1.default.deepStrictEqual(o0.data, { list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 });
    });
    (0, node_test_1.it)('levels', async () => {
        const r0 = new ordu_1.Ordu();
        function collect(t) {
            t.data.n.push(t.node.val.n);
        }
        const d0 = {
            x: {
                x0: {
                    y0: { n: 0 },
                    y1: { n: 1 },
                },
                x1: {
                    y0: { n: 2 },
                    y1: { n: 3 },
                }
            },
            n: []
        };
        r0.add([{
                select: 'x', apply: [{
                        select: '', apply: collect
                    }],
            }]);
        const o0 = r0.execSync({}, d0);
        // console.dir(o0.data, { depth: null })
        node_assert_1.default.deepStrictEqual(o0.data.n, [0, 1, 2, 3]);
    });
    (0, node_test_1.it)('custom', async () => {
        const r0 = new ordu_1.Ordu();
        function collect(t) {
            t.data.n.push(t.node.val.n);
        }
        const d0 = {
            x: {
                x0: {
                    y0: { n: 0 },
                    y1: { n: 1 },
                },
                x1: {
                    y0: { n: 2 },
                    y1: { n: 3 },
                }
            },
            n: []
        };
        r0.add([{
                select: (source) => {
                    const children = Object.values(Object.entries(source.x).filter(n => n[0] === 'x1').map(n => n[1])[0]);
                    return children;
                },
                apply: collect,
            }]);
        const o0 = r0.execSync({}, d0);
        node_assert_1.default.deepStrictEqual(o0.data.n, [2, 3]);
    });
    (0, node_test_1.it)('sort-sync', async () => {
        const r0 = new ordu_1.Ordu({
            select: {
                sort: true
            }
        });
        function f0(t) {
            t.data.f0 = 0;
        }
        function f1(t) {
            t.data.f1 = 1;
        }
        function g0(t) {
            t.data.g.push(t.node.val.x);
        }
        function g1(t) {
            t.data.g.push(t.node.val.x * 2);
        }
        const d0 = {
            map0: {
                b: { x: 1 },
                a: { x: 0 },
            },
            g: []
        };
        r0.add([
            f0,
            {
                select: 'map0', apply: [
                    g0,
                    g1,
                ]
            },
            f1
        ]);
        const o0 = r0.execSync({}, d0);
        // console.dir(o0.data, { depth: null })
        node_assert_1.default.deepStrictEqual(o0.data, { map0: { b: { x: 1 }, a: { x: 0 } }, g: [0, 0, 1, 2], f0: 0, f1: 1 });
    });
});
//# sourceMappingURL=deep.test.js.map