"use strict";
/* Copyright (c) 2016-2020 Richard Rodger, MIT License */
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
const Ordu = ordu_1.LegacyOrdu;
(0, node_test_1.describe)('ordu-legacy', function () {
    (0, node_test_1.it)('construct', async () => {
        const w = Ordu();
        expect(w).to.exist();
        const wn = ('' + w).replace(/ordu\d+/g, 'ordu0');
        expect(wn).to.equal('ordu0:[]');
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
        expect(data.foo).equal('GRE');
        // console.log(data.foo) // prints 'GRE' (first, second)
        data = { foo: 'blue' };
        w.process({ tags: ['upper'] }, ctxt, data);
        // console.log(data.foo) // prints 'BLUE' (second)
        expect(data.foo).equals('BLUE');
        data = [];
        const res = w.process(ctxt, data);
        // console.log(res) // prints {kind: 'error', why: 'no foo', ... introspection ...}
        expect(res).equals({
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
        expect(data.x).to.not.exist();
        let res = w.process(ctxt, data);
        expect(res).to.not.exist();
        expect(data.x).to.equal(1);
        w.add(function failer(ctxt, data) {
            return { kind: 'error' };
        });
        data = {};
        res = w.process(ctxt, data);
        expect(data.x).to.equal(1);
        expect(res.kind).to.equal('error');
        expect(res.index$).to.equal(1);
        expect(res.taskname$).to.equal('failer');
        expect(res.ctxt$).to.equal(ctxt);
        expect(res.data$).to.equal(data);
        const wn = ('' + w).replace(/ordu\d+/g, 'ordu1');
        expect(wn).to.equal('ordu1:[ordu1_task0,failer]');
    });
    (0, node_test_1.it)('list', async () => {
        const w = Ordu({ name: 'foo' });
        w.add(function zero() { })
            .add(function () { })
            .add(function two() { });
        expect(w.tasknames()).to.equal(['zero', 'foo_task1', 'two']);
        expect(w.taskdetails()).to.equal([
            'zero:{tags:}',
            'foo_task1:{tags:}',
            'two:{tags:}',
        ]);
        expect('' + w).to.equal('foo:[zero,foo_task1,two]');
    });
    (0, node_test_1.it)('process', async () => {
        const w = Ordu({ name: 'tags' });
        w.add(function zero(c, d) {
            d.zero = true;
        });
        let data = {};
        expect(w.process()).to.equal(null);
        expect(data.zero).to.not.exist();
        data = {};
        expect(w.process(data)).to.equal(null);
        expect(data.zero).to.be.true();
        data = {};
        expect(w.process({}, data)).to.equal(null);
        expect(data.zero).to.be.true();
        data = {};
        expect(w.process({}, {}, data)).to.equal(null);
        expect(data.zero).to.be.true();
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
        expect(w.process({}, data)).to.equal(null);
        expect(data).to.equal(['zero', 'one', 'two']);
        data = [];
        expect(w.process({ tags: ['red'] }, {}, data)).to.equal(null);
        expect(data).to.equal(['zero']);
        w.add({ tags: ['red', 'blue'] }, function three(c, d) {
            d.push('three');
        });
        data = [];
        expect(w.process({ tags: ['blue', 'red'] }, {}, data)).to.equal(null);
        expect(data).to.equal(['three']);
        data = [];
        expect(w.process({ tags: ['red'] }, {}, data)).to.equal(null);
        expect(data).to.equal(['zero', 'three']);
        data = [];
        expect(w.process({ tags: ['blue'] }, {}, data)).to.equal(null);
        expect(data).to.equal(['three']);
        data = [];
        expect(w.process({ tags: [] }, {}, data)).to.equal(null);
        expect(data).to.equal(['zero', 'one', 'two', 'three']);
    });
});
//# sourceMappingURL=ordu-legacy.test.js.map