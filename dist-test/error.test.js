"use strict";
/* Copyright (c) 2016-2025 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
(0, node_test_1.describe)('error', function () {
    (0, node_test_1.it)('basic-capture', async () => {
        const r0 = new __1.Ordu();
        function f0(t) {
            t.data.f0 = 0;
        }
        function f1(_t) {
            throw new Error('f1');
        }
        function f2(t) {
            t.data.f2 = 1;
        }
        const d0 = {};
        r0.add([
            f0,
            f1,
            f2,
        ]);
        const o0 = r0.execSync({}, d0);
        node_assert_1.default.strictEqual(o0?.err?.message, 'f1');
    });
});
//# sourceMappingURL=error.test.js.map