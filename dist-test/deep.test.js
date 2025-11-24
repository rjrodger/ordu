"use strict";
/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ordu_1 = require("../dist/ordu");
const node_test_1 = require("node:test");
const Code = __importStar(require("@hapi/code"));
const expect = Code.expect;
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
        expect(o0.data)
            .equal({ list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 });
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
        expect(o0.data)
            .equal({ list0: [{ x: 0 }, { x: 1 }], g: [0, 0, 1, 2], f0: 0, f1: 1 });
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
        expect(o0.data.n).equal([0, 1, 2, 3]);
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
        expect(o0.data.n).equal([2, 3]);
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
        expect(o0.data)
            .equal({ map0: { b: { x: 1 }, a: { x: 0 } }, g: [0, 0, 1, 2], f0: 0, f1: 1 });
    });
});
//# sourceMappingURL=deep.test.js.map