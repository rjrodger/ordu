"use strict";
/* Copyright (c) 2016-2025 Richard Rodger, MIT License */
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
const __1 = require("..");
const node_test_1 = require("node:test");
const Code = __importStar(require("@hapi/code"));
const expect = Code.expect;
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
        expect(o0?.err?.message).equal('f1');
    });
});
//# sourceMappingURL=error.test.js.map