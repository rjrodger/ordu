(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Ordu = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){

/**
 * Array#filter.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Object=} self
 * @return {Array}
 * @throw TypeError
 */

module.exports = function (arr, fn, self) {
  if (arr.filter) return arr.filter(fn, self);
  if (void 0 === arr || null === arr) throw new TypeError;
  if ('function' != typeof fn) throw new TypeError;
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if (!hasOwn.call(arr, i)) continue;
    var val = arr[i];
    if (fn.call(self, val, i, arr)) ret.push(val);
  }
  return ret;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],3:[function(require,module,exports){
(function (global){(function (){
'use strict';

var filter = require('array-filter');

module.exports = function availableTypedArrays() {
	return filter([
		'BigInt64Array',
		'BigUint64Array',
		'Float32Array',
		'Float64Array',
		'Int16Array',
		'Int32Array',
		'Int8Array',
		'Uint16Array',
		'Uint32Array',
		'Uint8Array',
		'Uint8ClampedArray'
	], function (typedArray) {
		return typeof global[typedArray] === 'function';
	});
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"array-filter":2}],4:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],5:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":4,"buffer":5,"ieee754":16}],6:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":7,"get-intrinsic":12}],7:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":11,"get-intrinsic":12}],8:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":12}],9:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],10:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],11:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":10}],12:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":11,"has":15,"has-symbols":13}],13:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":14}],14:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],15:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":11}],16:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],17:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],18:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":6}],19:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],20:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var generatorFunc = getGeneratorFunc();
var GeneratorFunction = getProto && generatorFunc ? getProto(generatorFunc) : false;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	return getProto && getProto(fn) === GeneratorFunction;
};

},{}],21:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new global[typedArray]();
		if (!(Symbol.toStringTag in arr)) {
			throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
		}
		var proto = getPrototypeOf(arr);
		var descriptor = gOPD(proto, Symbol.toStringTag);
		if (!descriptor) {
			var superProto = getPrototypeOf(proto);
			descriptor = gOPD(superProto, Symbol.toStringTag);
		}
		toStrTags[typedArray] = descriptor.get;
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":3,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":8,"foreach":9,"has-symbols":13}],22:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],23:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":22,"timers":23}],24:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],25:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
isSharedArrayBufferToString.working = (
  typeof SharedArrayBuffer !== 'undefined' &&
  isSharedArrayBufferToString(new SharedArrayBuffer())
);
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBuffer;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":18,"is-generator-function":20,"is-typed-array":21,"which-typed-array":27}],26:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":24,"./support/types":25,"_process":22,"inherits":17}],27:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var arr = new global[typedArray]();
			if (!(Symbol.toStringTag in arr)) {
				throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
			}
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":3,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":8,"foreach":9,"has-symbols":13,"is-typed-array":21}],28:[function(require,module,exports){
(function (global){(function (){
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).Ordu=t()}}((function(){var t,e,r,n=(t=function(t,r){(function(t){(function(){"use strict";function t(t){if(t>2147483647)throw new RangeError('The value "'+t+'" is invalid for option "size"');var e=new Uint8Array(t);return e.__proto__=n.prototype,e}function n(t,e,r){if("number"==typeof t){if("string"==typeof e)throw new TypeError('The "string" argument must be of type string. Received type number');return s(t)}return o(t,e,r)}function o(e,r,o){if("string"==typeof e)return function(e,r){if("string"==typeof r&&""!==r||(r="utf8"),!n.isEncoding(r))throw new TypeError("Unknown encoding: "+r);var o=0|a(e,r),i=t(o),s=i.write(e,r);return s!==o&&(i=i.slice(0,s)),i}(e,r);if(ArrayBuffer.isView(e))return u(e);if(null==e)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e);if(R(e,ArrayBuffer)||e&&R(e.buffer,ArrayBuffer))return function(t,e,r){if(e<0||t.byteLength<e)throw new RangeError('"offset" is outside of buffer bounds');if(t.byteLength<e+(r||0))throw new RangeError('"length" is outside of buffer bounds');var o;return(o=void 0===e&&void 0===r?new Uint8Array(t):void 0===r?new Uint8Array(t,e):new Uint8Array(t,e,r)).__proto__=n.prototype,o}(e,r,o);if("number"==typeof e)throw new TypeError('The "value" argument must not be of type number. Received type number');var i=e.valueOf&&e.valueOf();if(null!=i&&i!==e)return n.from(i,r,o);var s=function(e){if(n.isBuffer(e)){var r=0|f(e.length),o=t(r);return 0===o.length||e.copy(o,0,0,r),o}return void 0!==e.length?"number"!=typeof e.length||N(e.length)?t(0):u(e):"Buffer"===e.type&&Array.isArray(e.data)?u(e.data):void 0}(e);if(s)return s;if("undefined"!=typeof Symbol&&null!=Symbol.toPrimitive&&"function"==typeof e[Symbol.toPrimitive])return n.from(e[Symbol.toPrimitive]("string"),r,o);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e)}function i(t){if("number"!=typeof t)throw new TypeError('"size" argument must be of type number');if(t<0)throw new RangeError('The value "'+t+'" is invalid for option "size"')}function s(e){return i(e),t(e<0?0:0|f(e))}function u(e){for(var r=e.length<0?0:0|f(e.length),n=t(r),o=0;o<r;o+=1)n[o]=255&e[o];return n}function f(t){if(t>=2147483647)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+2147483647..toString(16)+" bytes");return 0|t}function a(t,e){if(n.isBuffer(t))return t.length;if(ArrayBuffer.isView(t)||R(t,ArrayBuffer))return t.byteLength;if("string"!=typeof t)throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof t);var r=t.length,o=arguments.length>2&&!0===arguments[2];if(!o&&0===r)return 0;for(var i=!1;;)switch(e){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":return I(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return P(t).length;default:if(i)return o?-1:I(t).length;e=(""+e).toLowerCase(),i=!0}}function c(t,e,r){var n=t[e];t[e]=t[r],t[r]=n}function l(t,e,r,o,i){if(0===t.length)return-1;if("string"==typeof r?(o=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),N(r=+r)&&(r=i?0:t.length-1),r<0&&(r=t.length+r),r>=t.length){if(i)return-1;r=t.length-1}else if(r<0){if(!i)return-1;r=0}if("string"==typeof e&&(e=n.from(e,o)),n.isBuffer(e))return 0===e.length?-1:h(t,e,r,o,i);if("number"==typeof e)return e&=255,"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(t,e,r):Uint8Array.prototype.lastIndexOf.call(t,e,r):h(t,[e],r,o,i);throw new TypeError("val must be string, number or Buffer")}function h(t,e,r,n,o){var i,s=1,u=t.length,f=e.length;if(void 0!==n&&("ucs2"===(n=String(n).toLowerCase())||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||e.length<2)return-1;s=2,u/=2,f/=2,r/=2}function a(t,e){return 1===s?t[e]:t.readUInt16BE(e*s)}if(o){var c=-1;for(i=r;i<u;i++)if(a(t,i)===a(e,-1===c?0:i-c)){if(-1===c&&(c=i),i-c+1===f)return c*s}else-1!==c&&(i-=i-c),c=-1}else for(r+f>u&&(r=u-f),i=r;i>=0;i--){for(var l=!0,h=0;h<f;h++)if(a(t,i+h)!==a(e,h)){l=!1;break}if(l)return i}return-1}function p(t,e,r,n){r=Number(r)||0;var o=t.length-r;n?(n=Number(n))>o&&(n=o):n=o;var i=e.length;n>i/2&&(n=i/2);for(var s=0;s<n;++s){var u=parseInt(e.substr(2*s,2),16);if(N(u))return s;t[r+s]=u}return s}function y(t,e,r,n){return U(I(e,t.length-r),t,r,n)}function g(t,e,r,n){return U(function(t){for(var e=[],r=0;r<t.length;++r)e.push(255&t.charCodeAt(r));return e}(e),t,r,n)}function d(t,e,r,n){return g(t,e,r,n)}function v(t,e,r,n){return U(P(e),t,r,n)}function m(t,e,r,n){return U(function(t,e){for(var r,n,o,i=[],s=0;s<t.length&&!((e-=2)<0);++s)n=(r=t.charCodeAt(s))>>8,o=r%256,i.push(o),i.push(n);return i}(e,t.length-r),t,r,n)}function w(t,e,r){return 0===e&&r===t.length?A.fromByteArray(t):A.fromByteArray(t.slice(e,r))}function b(t,e,r){r=Math.min(t.length,r);for(var n=[],o=e;o<r;){var i,s,u,f,a=t[o],c=null,l=a>239?4:a>223?3:a>191?2:1;if(o+l<=r)switch(l){case 1:a<128&&(c=a);break;case 2:128==(192&(i=t[o+1]))&&(f=(31&a)<<6|63&i)>127&&(c=f);break;case 3:i=t[o+1],s=t[o+2],128==(192&i)&&128==(192&s)&&(f=(15&a)<<12|(63&i)<<6|63&s)>2047&&(f<55296||f>57343)&&(c=f);break;case 4:i=t[o+1],s=t[o+2],u=t[o+3],128==(192&i)&&128==(192&s)&&128==(192&u)&&(f=(15&a)<<18|(63&i)<<12|(63&s)<<6|63&u)>65535&&f<1114112&&(c=f)}null===c?(c=65533,l=1):c>65535&&(c-=65536,n.push(c>>>10&1023|55296),c=56320|1023&c),n.push(c),o+=l}return function(t){var e=t.length;if(e<=E)return String.fromCharCode.apply(String,t);for(var r="",n=0;n<e;)r+=String.fromCharCode.apply(String,t.slice(n,n+=E));return r}(n)}r.Buffer=n,r.INSPECT_MAX_BYTES=50,n.TYPED_ARRAY_SUPPORT=function(){try{var t=new Uint8Array(1);return t.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===t.foo()}catch(e){return!1}}(),n.TYPED_ARRAY_SUPPORT||"undefined"==typeof console||"function"!=typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),Object.defineProperty(n.prototype,"parent",{enumerable:!0,get:function(){if(n.isBuffer(this))return this.buffer}}),Object.defineProperty(n.prototype,"offset",{enumerable:!0,get:function(){if(n.isBuffer(this))return this.byteOffset}}),"undefined"!=typeof Symbol&&null!=Symbol.species&&n[Symbol.species]===n&&Object.defineProperty(n,Symbol.species,{value:null,configurable:!0,enumerable:!1,writable:!1}),n.poolSize=8192,n.from=function(t,e,r){return o(t,e,r)},n.prototype.__proto__=Uint8Array.prototype,n.__proto__=Uint8Array,n.alloc=function(e,r,n){return function(e,r,n){return i(e),e<=0?t(e):void 0!==r?"string"==typeof n?t(e).fill(r,n):t(e).fill(r):t(e)}(e,r,n)},n.allocUnsafe=function(t){return s(t)},n.allocUnsafeSlow=function(t){return s(t)},n.isBuffer=function(t){return null!=t&&!0===t._isBuffer&&t!==n.prototype},n.compare=function(t,e){if(R(t,Uint8Array)&&(t=n.from(t,t.offset,t.byteLength)),R(e,Uint8Array)&&(e=n.from(e,e.offset,e.byteLength)),!n.isBuffer(t)||!n.isBuffer(e))throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');if(t===e)return 0;for(var r=t.length,o=e.length,i=0,s=Math.min(r,o);i<s;++i)if(t[i]!==e[i]){r=t[i],o=e[i];break}return r<o?-1:o<r?1:0},n.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},n.concat=function(t,e){if(!Array.isArray(t))throw new TypeError('"list" argument must be an Array of Buffers');if(0===t.length)return n.alloc(0);var r;if(void 0===e)for(e=0,r=0;r<t.length;++r)e+=t[r].length;var o=n.allocUnsafe(e),i=0;for(r=0;r<t.length;++r){var s=t[r];if(R(s,Uint8Array)&&(s=n.from(s)),!n.isBuffer(s))throw new TypeError('"list" argument must be an Array of Buffers');s.copy(o,i),i+=s.length}return o},n.byteLength=a,n.prototype._isBuffer=!0,n.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var e=0;e<t;e+=2)c(this,e,e+1);return this},n.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var e=0;e<t;e+=4)c(this,e,e+3),c(this,e+1,e+2);return this},n.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var e=0;e<t;e+=8)c(this,e,e+7),c(this,e+1,e+6),c(this,e+2,e+5),c(this,e+3,e+4);return this},n.prototype.toString=function(){var t=this.length;return 0===t?"":0===arguments.length?b(this,0,t):function(t,e,r){var n=!1;if((void 0===e||e<0)&&(e=0),e>this.length)return"";if((void 0===r||r>this.length)&&(r=this.length),r<=0)return"";if((r>>>=0)<=(e>>>=0))return"";for(t||(t="utf8");;)switch(t){case"hex":return j(this,e,r);case"utf8":case"utf-8":return b(this,e,r);case"ascii":return _(this,e,r);case"latin1":case"binary":return O(this,e,r);case"base64":return w(this,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return k(this,e,r);default:if(n)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),n=!0}}.apply(this,arguments)},n.prototype.toLocaleString=n.prototype.toString,n.prototype.equals=function(t){if(!n.isBuffer(t))throw new TypeError("Argument must be a Buffer");return this===t||0===n.compare(this,t)},n.prototype.inspect=function(){var t="",e=r.INSPECT_MAX_BYTES;return t=this.toString("hex",0,e).replace(/(.{2})/g,"$1 ").trim(),this.length>e&&(t+=" ... "),"<Buffer "+t+">"},n.prototype.compare=function(t,e,r,o,i){if(R(t,Uint8Array)&&(t=n.from(t,t.offset,t.byteLength)),!n.isBuffer(t))throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+typeof t);if(void 0===e&&(e=0),void 0===r&&(r=t?t.length:0),void 0===o&&(o=0),void 0===i&&(i=this.length),e<0||r>t.length||o<0||i>this.length)throw new RangeError("out of range index");if(o>=i&&e>=r)return 0;if(o>=i)return-1;if(e>=r)return 1;if(this===t)return 0;for(var s=(i>>>=0)-(o>>>=0),u=(r>>>=0)-(e>>>=0),f=Math.min(s,u),a=this.slice(o,i),c=t.slice(e,r),l=0;l<f;++l)if(a[l]!==c[l]){s=a[l],u=c[l];break}return s<u?-1:u<s?1:0},n.prototype.includes=function(t,e,r){return-1!==this.indexOf(t,e,r)},n.prototype.indexOf=function(t,e,r){return l(this,t,e,r,!0)},n.prototype.lastIndexOf=function(t,e,r){return l(this,t,e,r,!1)},n.prototype.write=function(t,e,r,n){if(void 0===e)n="utf8",r=this.length,e=0;else if(void 0===r&&"string"==typeof e)n=e,r=this.length,e=0;else{if(!isFinite(e))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");e>>>=0,isFinite(r)?(r>>>=0,void 0===n&&(n="utf8")):(n=r,r=void 0)}var o=this.length-e;if((void 0===r||r>o)&&(r=o),t.length>0&&(r<0||e<0)||e>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var i=!1;;)switch(n){case"hex":return p(this,t,e,r);case"utf8":case"utf-8":return y(this,t,e,r);case"ascii":return g(this,t,e,r);case"latin1":case"binary":return d(this,t,e,r);case"base64":return v(this,t,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return m(this,t,e,r);default:if(i)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),i=!0}},n.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var E=4096;function _(t,e,r){var n="";r=Math.min(t.length,r);for(var o=e;o<r;++o)n+=String.fromCharCode(127&t[o]);return n}function O(t,e,r){var n="";r=Math.min(t.length,r);for(var o=e;o<r;++o)n+=String.fromCharCode(t[o]);return n}function j(t,e,r){var n,o=t.length;(!e||e<0)&&(e=0),(!r||r<0||r>o)&&(r=o);for(var i="",s=e;s<r;++s)i+=(n=t[s])<16?"0"+n.toString(16):n.toString(16);return i}function k(t,e,r){for(var n=t.slice(e,r),o="",i=0;i<n.length;i+=2)o+=String.fromCharCode(n[i]+256*n[i+1]);return o}function S(t,e,r){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+e>r)throw new RangeError("Trying to access beyond buffer length")}function L(t,e,r,o,i,s){if(!n.isBuffer(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(e>i||e<s)throw new RangeError('"value" argument is out of bounds');if(r+o>t.length)throw new RangeError("Index out of range")}function B(t,e,r,n,o,i){if(r+n>t.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range")}function x(t,e,r,n,o){return e=+e,r>>>=0,o||B(t,0,r,4),M.write(t,e,r,n,23,4),r+4}function T(t,e,r,n,o){return e=+e,r>>>=0,o||B(t,0,r,8),M.write(t,e,r,n,52,8),r+8}n.prototype.slice=function(t,e){var r=this.length;(t=~~t)<0?(t+=r)<0&&(t=0):t>r&&(t=r),(e=void 0===e?r:~~e)<0?(e+=r)<0&&(e=0):e>r&&(e=r),e<t&&(e=t);var o=this.subarray(t,e);return o.__proto__=n.prototype,o},n.prototype.readUIntLE=function(t,e,r){t>>>=0,e>>>=0,r||S(t,e,this.length);for(var n=this[t],o=1,i=0;++i<e&&(o*=256);)n+=this[t+i]*o;return n},n.prototype.readUIntBE=function(t,e,r){t>>>=0,e>>>=0,r||S(t,e,this.length);for(var n=this[t+--e],o=1;e>0&&(o*=256);)n+=this[t+--e]*o;return n},n.prototype.readUInt8=function(t,e){return t>>>=0,e||S(t,1,this.length),this[t]},n.prototype.readUInt16LE=function(t,e){return t>>>=0,e||S(t,2,this.length),this[t]|this[t+1]<<8},n.prototype.readUInt16BE=function(t,e){return t>>>=0,e||S(t,2,this.length),this[t]<<8|this[t+1]},n.prototype.readUInt32LE=function(t,e){return t>>>=0,e||S(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},n.prototype.readUInt32BE=function(t,e){return t>>>=0,e||S(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},n.prototype.readIntLE=function(t,e,r){t>>>=0,e>>>=0,r||S(t,e,this.length);for(var n=this[t],o=1,i=0;++i<e&&(o*=256);)n+=this[t+i]*o;return n>=(o*=128)&&(n-=Math.pow(2,8*e)),n},n.prototype.readIntBE=function(t,e,r){t>>>=0,e>>>=0,r||S(t,e,this.length);for(var n=e,o=1,i=this[t+--n];n>0&&(o*=256);)i+=this[t+--n]*o;return i>=(o*=128)&&(i-=Math.pow(2,8*e)),i},n.prototype.readInt8=function(t,e){return t>>>=0,e||S(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t]},n.prototype.readInt16LE=function(t,e){t>>>=0,e||S(t,2,this.length);var r=this[t]|this[t+1]<<8;return 32768&r?4294901760|r:r},n.prototype.readInt16BE=function(t,e){t>>>=0,e||S(t,2,this.length);var r=this[t+1]|this[t]<<8;return 32768&r?4294901760|r:r},n.prototype.readInt32LE=function(t,e){return t>>>=0,e||S(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},n.prototype.readInt32BE=function(t,e){return t>>>=0,e||S(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},n.prototype.readFloatLE=function(t,e){return t>>>=0,e||S(t,4,this.length),M.read(this,t,!0,23,4)},n.prototype.readFloatBE=function(t,e){return t>>>=0,e||S(t,4,this.length),M.read(this,t,!1,23,4)},n.prototype.readDoubleLE=function(t,e){return t>>>=0,e||S(t,8,this.length),M.read(this,t,!0,52,8)},n.prototype.readDoubleBE=function(t,e){return t>>>=0,e||S(t,8,this.length),M.read(this,t,!1,52,8)},n.prototype.writeUIntLE=function(t,e,r,n){t=+t,e>>>=0,r>>>=0,n||L(this,t,e,r,Math.pow(2,8*r)-1,0);var o=1,i=0;for(this[e]=255&t;++i<r&&(o*=256);)this[e+i]=t/o&255;return e+r},n.prototype.writeUIntBE=function(t,e,r,n){t=+t,e>>>=0,r>>>=0,n||L(this,t,e,r,Math.pow(2,8*r)-1,0);var o=r-1,i=1;for(this[e+o]=255&t;--o>=0&&(i*=256);)this[e+o]=t/i&255;return e+r},n.prototype.writeUInt8=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,1,255,0),this[e]=255&t,e+1},n.prototype.writeUInt16LE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,2,65535,0),this[e]=255&t,this[e+1]=t>>>8,e+2},n.prototype.writeUInt16BE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,2,65535,0),this[e]=t>>>8,this[e+1]=255&t,e+2},n.prototype.writeUInt32LE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,4,4294967295,0),this[e+3]=t>>>24,this[e+2]=t>>>16,this[e+1]=t>>>8,this[e]=255&t,e+4},n.prototype.writeUInt32BE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,4,4294967295,0),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4},n.prototype.writeIntLE=function(t,e,r,n){if(t=+t,e>>>=0,!n){var o=Math.pow(2,8*r-1);L(this,t,e,r,o-1,-o)}var i=0,s=1,u=0;for(this[e]=255&t;++i<r&&(s*=256);)t<0&&0===u&&0!==this[e+i-1]&&(u=1),this[e+i]=(t/s>>0)-u&255;return e+r},n.prototype.writeIntBE=function(t,e,r,n){if(t=+t,e>>>=0,!n){var o=Math.pow(2,8*r-1);L(this,t,e,r,o-1,-o)}var i=r-1,s=1,u=0;for(this[e+i]=255&t;--i>=0&&(s*=256);)t<0&&0===u&&0!==this[e+i+1]&&(u=1),this[e+i]=(t/s>>0)-u&255;return e+r},n.prototype.writeInt8=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,1,127,-128),t<0&&(t=255+t+1),this[e]=255&t,e+1},n.prototype.writeInt16LE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,2,32767,-32768),this[e]=255&t,this[e+1]=t>>>8,e+2},n.prototype.writeInt16BE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,2,32767,-32768),this[e]=t>>>8,this[e+1]=255&t,e+2},n.prototype.writeInt32LE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,4,2147483647,-2147483648),this[e]=255&t,this[e+1]=t>>>8,this[e+2]=t>>>16,this[e+3]=t>>>24,e+4},n.prototype.writeInt32BE=function(t,e,r){return t=+t,e>>>=0,r||L(this,t,e,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4},n.prototype.writeFloatLE=function(t,e,r){return x(this,t,e,!0,r)},n.prototype.writeFloatBE=function(t,e,r){return x(this,t,e,!1,r)},n.prototype.writeDoubleLE=function(t,e,r){return T(this,t,e,!0,r)},n.prototype.writeDoubleBE=function(t,e,r){return T(this,t,e,!1,r)},n.prototype.copy=function(t,e,r,o){if(!n.isBuffer(t))throw new TypeError("argument should be a Buffer");if(r||(r=0),o||0===o||(o=this.length),e>=t.length&&(e=t.length),e||(e=0),o>0&&o<r&&(o=r),o===r)return 0;if(0===t.length||0===this.length)return 0;if(e<0)throw new RangeError("targetStart out of bounds");if(r<0||r>=this.length)throw new RangeError("Index out of range");if(o<0)throw new RangeError("sourceEnd out of bounds");o>this.length&&(o=this.length),t.length-e<o-r&&(o=t.length-e+r);var i=o-r;if(this===t&&"function"==typeof Uint8Array.prototype.copyWithin)this.copyWithin(e,r,o);else if(this===t&&r<e&&e<o)for(var s=i-1;s>=0;--s)t[s+e]=this[s+r];else Uint8Array.prototype.set.call(t,this.subarray(r,o),e);return i},n.prototype.fill=function(t,e,r,o){if("string"==typeof t){if("string"==typeof e?(o=e,e=0,r=this.length):"string"==typeof r&&(o=r,r=this.length),void 0!==o&&"string"!=typeof o)throw new TypeError("encoding must be a string");if("string"==typeof o&&!n.isEncoding(o))throw new TypeError("Unknown encoding: "+o);if(1===t.length){var i=t.charCodeAt(0);("utf8"===o&&i<128||"latin1"===o)&&(t=i)}}else"number"==typeof t&&(t&=255);if(e<0||this.length<e||this.length<r)throw new RangeError("Out of range index");if(r<=e)return this;var s;if(e>>>=0,r=void 0===r?this.length:r>>>0,t||(t=0),"number"==typeof t)for(s=e;s<r;++s)this[s]=t;else{var u=n.isBuffer(t)?t:n.from(t,o),f=u.length;if(0===f)throw new TypeError('The value "'+t+'" is invalid for argument "value"');for(s=0;s<r-e;++s)this[s+e]=u[s%f]}return this};var C=/[^+/0-9A-Za-z-_]/g;function I(t,e){var r;e=e||1/0;for(var n=t.length,o=null,i=[],s=0;s<n;++s){if((r=t.charCodeAt(s))>55295&&r<57344){if(!o){if(r>56319){(e-=3)>-1&&i.push(239,191,189);continue}if(s+1===n){(e-=3)>-1&&i.push(239,191,189);continue}o=r;continue}if(r<56320){(e-=3)>-1&&i.push(239,191,189),o=r;continue}r=65536+(o-55296<<10|r-56320)}else o&&(e-=3)>-1&&i.push(239,191,189);if(o=null,r<128){if((e-=1)<0)break;i.push(r)}else if(r<2048){if((e-=2)<0)break;i.push(r>>6|192,63&r|128)}else if(r<65536){if((e-=3)<0)break;i.push(r>>12|224,r>>6&63|128,63&r|128)}else{if(!(r<1114112))throw new Error("Invalid code point");if((e-=4)<0)break;i.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128)}}return i}function P(t){return A.toByteArray(function(t){if((t=(t=t.split("=")[0]).trim().replace(C,"")).length<2)return"";for(;t.length%4!=0;)t+="=";return t}(t))}function U(t,e,r,n){for(var o=0;o<n&&!(o+r>=e.length||o>=t.length);++o)e[o+r]=t[o];return o}function R(t,e){return t instanceof e||null!=t&&null!=t.constructor&&null!=t.constructor.name&&t.constructor.name===e.name}function N(t){return t!=t}}).call(this)}).call(this,n({}).Buffer)},function(r){return e||t(e={exports:{},parent:r},e.exports),e.exports}),o={},i="object"==typeof Reflect?Reflect:null,s=i&&"function"==typeof i.apply?i.apply:function(t,e,r){return Function.prototype.apply.call(t,e,r)};r=i&&"function"==typeof i.ownKeys?i.ownKeys:Object.getOwnPropertySymbols?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:function(t){return Object.getOwnPropertyNames(t)};var u=Number.isNaN||function(t){return t!=t};function f(){f.init.call(this)}(o=f).once=function(t,e){return new Promise((function(r,n){function o(r){t.removeListener(e,i),n(r)}function i(){"function"==typeof t.removeListener&&t.removeListener("error",o),r([].slice.call(arguments))}v(t,e,i,{once:!0}),"error"!==e&&function(t,e,r){"function"==typeof t.on&&v(t,"error",e,{once:!0})}(t,o)}))},f.EventEmitter=f,f.prototype._events=void 0,f.prototype._eventsCount=0,f.prototype._maxListeners=void 0;var a=10;function c(t){if("function"!=typeof t)throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof t)}function l(t){return void 0===t._maxListeners?f.defaultMaxListeners:t._maxListeners}function h(t,e,r,n){var o,i,s,u;if(c(r),void 0===(i=t._events)?(i=t._events=Object.create(null),t._eventsCount=0):(void 0!==i.newListener&&(t.emit("newListener",e,r.listener?r.listener:r),i=t._events),s=i[e]),void 0===s)s=i[e]=r,++t._eventsCount;else if("function"==typeof s?s=i[e]=n?[r,s]:[s,r]:n?s.unshift(r):s.push(r),(o=l(t))>0&&s.length>o&&!s.warned){s.warned=!0;var f=new Error("Possible EventEmitter memory leak detected. "+s.length+" "+String(e)+" listeners added. Use emitter.setMaxListeners() to increase limit");f.name="MaxListenersExceededWarning",f.emitter=t,f.type=e,f.count=s.length,u=f,console&&console.warn&&console.warn(u)}return t}function p(t,e,r){var n={fired:!1,wrapFn:void 0,target:t,type:e,listener:r},o=function(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}.bind(n);return o.listener=r,n.wrapFn=o,o}function y(t,e,r){var n=t._events;if(void 0===n)return[];var o=n[e];return void 0===o?[]:"function"==typeof o?r?[o.listener||o]:[o]:r?function(t){for(var e=new Array(t.length),r=0;r<e.length;++r)e[r]=t[r].listener||t[r];return e}(o):d(o,o.length)}function g(t){var e=this._events;if(void 0!==e){var r=e[t];if("function"==typeof r)return 1;if(void 0!==r)return r.length}return 0}function d(t,e){for(var r=new Array(e),n=0;n<e;++n)r[n]=t[n];return r}function v(t,e,r,n){if("function"==typeof t.on)n.once?t.once(e,r):t.on(e,r);else{if("function"!=typeof t.addEventListener)throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof t);t.addEventListener(e,(function o(i){n.once&&t.removeEventListener(e,o),r(i)}))}}Object.defineProperty(f,"defaultMaxListeners",{enumerable:!0,get:function(){return a},set:function(t){if("number"!=typeof t||t<0||u(t))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+t+".");a=t}}),f.init=function(){void 0!==this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},f.prototype.setMaxListeners=function(t){if("number"!=typeof t||t<0||u(t))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+t+".");return this._maxListeners=t,this},f.prototype.getMaxListeners=function(){return l(this)},f.prototype.emit=function(t){for(var e=[],r=1;r<arguments.length;r++)e.push(arguments[r]);var n="error"===t,o=this._events;if(void 0!==o)n=n&&void 0===o.error;else if(!n)return!1;if(n){var i;if(e.length>0&&(i=e[0]),i instanceof Error)throw i;var u=new Error("Unhandled error."+(i?" ("+i.message+")":""));throw u.context=i,u}var f=o[t];if(void 0===f)return!1;if("function"==typeof f)s(f,this,e);else{var a=f.length,c=d(f,a);for(r=0;r<a;++r)s(c[r],this,e)}return!0},f.prototype.addListener=function(t,e){return h(this,t,e,!1)},f.prototype.on=f.prototype.addListener,f.prototype.prependListener=function(t,e){return h(this,t,e,!0)},f.prototype.once=function(t,e){return c(e),this.on(t,p(this,t,e)),this},f.prototype.prependOnceListener=function(t,e){return c(e),this.prependListener(t,p(this,t,e)),this},f.prototype.removeListener=function(t,e){var r,n,o,i,s;if(c(e),void 0===(n=this._events))return this;if(void 0===(r=n[t]))return this;if(r===e||r.listener===e)0==--this._eventsCount?this._events=Object.create(null):(delete n[t],n.removeListener&&this.emit("removeListener",t,r.listener||e));else if("function"!=typeof r){for(o=-1,i=r.length-1;i>=0;i--)if(r[i]===e||r[i].listener===e){s=r[i].listener,o=i;break}if(o<0)return this;0===o?r.shift():function(t,e){for(;e+1<t.length;e++)t[e]=t[e+1];t.pop()}(r,o),1===r.length&&(n[t]=r[0]),void 0!==n.removeListener&&this.emit("removeListener",t,s||e)}return this},f.prototype.off=f.prototype.removeListener,f.prototype.removeAllListeners=function(t){var e,r,n;if(void 0===(r=this._events))return this;if(void 0===r.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==r[t]&&(0==--this._eventsCount?this._events=Object.create(null):delete r[t]),this;if(0===arguments.length){var o,i=Object.keys(r);for(n=0;n<i.length;++n)"removeListener"!==(o=i[n])&&this.removeAllListeners(o);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if("function"==typeof(e=r[t]))this.removeListener(t,e);else if(void 0!==e)for(n=e.length-1;n>=0;n--)this.removeListener(t,e[n]);return this},f.prototype.listeners=function(t){return y(this,t,!0)},f.prototype.rawListeners=function(t){return y(this,t,!1)},f.listenerCount=function(t,e){return"function"==typeof t.listenerCount?t.listenerCount(e):g.call(t,e)},f.prototype.listenerCount=g,f.prototype.eventNames=function(){return this._eventsCount>0?r(this._events):[]};var m=function(...t){try{return JSON.stringify.apply(null,t)}catch(e){return"[Cannot display object: "+e.message+"]"}},w={};w=class extends Error{constructor(t){super(t.filter(t=>""!==t).map(t=>"string"==typeof t?t:t instanceof Error?t.message:m(t)).join(" ")||"Unknown error"),"function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,w.assert)}};var b,E=function(t,...e){if(!t){if(1===e.length&&e[0]instanceof Error)throw e[0];throw new w(e)}};const _={};b=function(t,e,r){if(!1===e||null==e)return t;"string"==typeof(r=r||{})&&(r={separator:r});const n=Array.isArray(e);E(!n||!r.separator,"Separator option no valid for array-based chain");const o=n?e:e.split(r.separator||".");let i=t;for(let s=0;s<o.length;++s){let t=o[s];const n=r.iterables&&_.iterables(i);if(Array.isArray(i)||"set"===n){const e=Number(t);Number.isInteger(e)&&(t=e<0?i.length+e:e)}if(!i||"function"==typeof i&&!1===r.functions||!n&&void 0===i[t]){E(!r.strict||s+1===o.length,"Missing segment",t,"in reach path ",e),E("object"==typeof i||!0===r.functions||"function"!=typeof i,"Invalid segment",t,"in reach path ",e),i=r.default;break}i=n?"set"===n?[...i][t]:i.get(t):i[t]}return i},_.iterables=function(t){return t instanceof Set?"set":t instanceof Map?"map":void 0};for(var A={toByteArray:function(t){var e,r,n=x(t),o=n[0],i=n[1],s=new k(function(t,e,r){return 3*(e+r)/4-r}(0,o,i)),u=0,f=i>0?o-4:o;for(r=0;r<f;r+=4)e=j[t.charCodeAt(r)]<<18|j[t.charCodeAt(r+1)]<<12|j[t.charCodeAt(r+2)]<<6|j[t.charCodeAt(r+3)],s[u++]=e>>16&255,s[u++]=e>>8&255,s[u++]=255&e;return 2===i&&(e=j[t.charCodeAt(r)]<<2|j[t.charCodeAt(r+1)]>>4,s[u++]=255&e),1===i&&(e=j[t.charCodeAt(r)]<<10|j[t.charCodeAt(r+1)]<<4|j[t.charCodeAt(r+2)]>>2,s[u++]=e>>8&255,s[u++]=255&e),s},fromByteArray:function(t){for(var e,r=t.length,n=r%3,o=[],i=0,s=r-n;i<s;i+=16383)o.push(T(t,i,i+16383>s?s:i+16383));return 1===n?(e=t[r-1],o.push(O[e>>2]+O[e<<4&63]+"==")):2===n&&(e=(t[r-2]<<8)+t[r-1],o.push(O[e>>10]+O[e>>4&63]+O[e<<2&63]+"=")),o.join("")}},O=[],j=[],k="undefined"!=typeof Uint8Array?Uint8Array:Array,S="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",L=0,B=S.length;L<B;++L)O[L]=S[L],j[S.charCodeAt(L)]=L;function x(t){var e=t.length;if(e%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var r=t.indexOf("=");return-1===r&&(r=e),[r,r===e?0:4-r%4]}function T(t,e,r){for(var n,o,i=[],s=e;s<r;s+=3)n=(t[s]<<16&16711680)+(t[s+1]<<8&65280)+(255&t[s+2]),i.push(O[(o=n)>>18&63]+O[o>>12&63]+O[o>>6&63]+O[63&o]);return i.join("")}j["-".charCodeAt(0)]=62,j["_".charCodeAt(0)]=63;var M={read:function(t,e,r,n,o){var i,s,u=8*o-n-1,f=(1<<u)-1,a=f>>1,c=-7,l=r?o-1:0,h=r?-1:1,p=t[e+l];for(l+=h,i=p&(1<<-c)-1,p>>=-c,c+=u;c>0;i=256*i+t[e+l],l+=h,c-=8);for(s=i&(1<<-c)-1,i>>=-c,c+=n;c>0;s=256*s+t[e+l],l+=h,c-=8);if(0===i)i=1-a;else{if(i===f)return s?NaN:1/0*(p?-1:1);s+=Math.pow(2,n),i-=a}return(p?-1:1)*s*Math.pow(2,i-n)},write:function(t,e,r,n,o,i){var s,u,f,a=8*i-o-1,c=(1<<a)-1,l=c>>1,h=23===o?Math.pow(2,-24)-Math.pow(2,-77):0,p=n?0:i-1,y=n?1:-1,g=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(u=isNaN(e)?1:0,s=c):(s=Math.floor(Math.log(e)/Math.LN2),e*(f=Math.pow(2,-s))<1&&(s--,f*=2),(e+=s+l>=1?h/f:h*Math.pow(2,1-l))*f>=2&&(s++,f/=2),s+l>=c?(u=0,s=c):s+l>=1?(u=(e*f-1)*Math.pow(2,o),s+=l):(u=e*Math.pow(2,l-1)*Math.pow(2,o),s=0));o>=8;t[r+p]=255&u,p+=y,u/=256,o-=8);for(s=s<<o|u,a+=o;a>0;t[r+p]=255&s,p+=y,s/=256,a-=8);t[r+p-y]|=128*g}},C={};(function(t){(function(){"use strict";const e={};C=C={array:Array.prototype,buffer:t&&t.prototype,date:Date.prototype,error:Error.prototype,generic:Object.prototype,map:Map.prototype,promise:Promise.prototype,regex:RegExp.prototype,set:Set.prototype,weakMap:WeakMap.prototype,weakSet:WeakSet.prototype},e.typeMap=new Map([["[object Error]",C.error],["[object Map]",C.map],["[object Promise]",C.promise],["[object Set]",C.set],["[object WeakMap]",C.weakMap],["[object WeakSet]",C.weakSet]]),C.getInternalProto=function(r){if(Array.isArray(r))return C.array;if(t&&r instanceof t)return C.buffer;if(r instanceof Date)return C.date;if(r instanceof RegExp)return C.regex;if(r instanceof Error)return C.error;const n=Object.prototype.toString.call(r);return e.typeMap.get(n)||C.generic}}).call(this)}).call(this,n({}).Buffer);var I={keys:function(t,e={}){return!1!==e.symbols?Reflect.ownKeys(t):Object.getOwnPropertyNames(t)}},P={};(function(t){(function(){"use strict";const e={needsProtoHack:new Set([C.set,C.map,C.weakSet,C.weakMap])};P=e.clone=function(r,n={},o=null){if("object"!=typeof r||null===r)return r;let i=e.clone,s=o;if(n.shallow){if(!0!==n.shallow)return e.cloneWithShallow(r,n);i=t=>t}else if(s){const t=s.get(r);if(t)return t}else s=new Map;const u=C.getInternalProto(r);if(u===C.buffer)return t&&t.from(r);if(u===C.date)return new Date(r.getTime());if(u===C.regex)return new RegExp(r);const f=e.base(r,u,n);if(f===r)return r;if(s&&s.set(r,f),u===C.set)for(const t of r)f.add(i(t,n,s));else if(u===C.map)for(const[t,e]of r)f.set(t,i(e,n,s));const a=I.keys(r,n);for(const t of a){if("__proto__"===t)continue;if(u===C.array&&"length"===t){f.length=r.length;continue}const e=Object.getOwnPropertyDescriptor(r,t);e?e.get||e.set?Object.defineProperty(f,t,e):e.enumerable?f[t]=i(r[t],n,s):Object.defineProperty(f,t,{enumerable:!1,writable:!0,configurable:!0,value:i(r[t],n,s)}):Object.defineProperty(f,t,{enumerable:!0,writable:!0,configurable:!0,value:i(r[t],n,s)})}return f},e.cloneWithShallow=function(t,r){const n=r.shallow;(r=Object.assign({},r)).shallow=!1;const o=new Map;for(const e of n){const r=b(t,e);"object"!=typeof r&&"function"!=typeof r||o.set(r,r)}return e.clone(t,r,o)},e.base=function(t,r,n){if(!1===n.prototype)return e.needsProtoHack.has(r)?new r.constructor:r===C.array?[]:{};const o=Object.getPrototypeOf(t);if(o&&o.isImmutable)return t;if(r===C.array){const t=[];return o!==r&&Object.setPrototypeOf(t,o),t}if(e.needsProtoHack.has(r)){const t=new o.constructor;return o!==r&&Object.setPrototypeOf(t,o),t}return Object.create(o)}}).call(this)}).call(this,n({}).Buffer);var U={};(function(t){(function(){"use strict";const e={};U=e.merge=function(r,n,o){if(E(r&&"object"==typeof r,"Invalid target value: must be an object"),E(null==n||"object"==typeof n,"Invalid source value: must be null, undefined, or an object"),!n)return r;if(o=Object.assign({nullOverride:!0,mergeArrays:!0},o),Array.isArray(n)){E(Array.isArray(r),"Cannot merge array onto an object"),o.mergeArrays||(r.length=0);for(let t=0;t<n.length;++t)r.push(P(n[t],{symbols:o.symbols}));return r}const i=I.keys(n,o);for(let s=0;s<i.length;++s){const u=i[s];if("__proto__"===u||!Object.prototype.propertyIsEnumerable.call(n,u))continue;const f=n[u];if(f&&"object"==typeof f){if(r[u]===f)continue;!r[u]||"object"!=typeof r[u]||Array.isArray(r[u])!==Array.isArray(f)||f instanceof Date||t&&t.isBuffer(f)||f instanceof RegExp?r[u]=P(f,{symbols:o.symbols}):e.merge(r[u],f,o)}else(null!=f||o.nullOverride)&&(r[u]=f)}return r}}).call(this)}).call(this,n({}).Buffer);var R;const N={};R=function(t,e,r={}){if(E(t&&"object"==typeof t,"Invalid defaults value: must be an object"),E(!e||!0===e||"object"==typeof e,"Invalid source value: must be true, falsy or an object"),E("object"==typeof r,"Invalid options: must be an object"),!e)return null;if(r.shallow)return N.applyToDefaultsWithShallow(t,e,r);const n=P(t);if(!0===e)return n;const o=void 0!==r.nullOverride&&r.nullOverride;return U(n,e,{nullOverride:o,mergeArrays:!1})},N.applyToDefaultsWithShallow=function(t,e,r){const n=r.shallow;E(Array.isArray(n),"Invalid keys");const o=new Map,i=!0===e?null:new Set;for(let f of n){f=Array.isArray(f)?f:f.split(".");const r=b(t,f);r&&"object"==typeof r?o.set(r,i&&b(e,f)||r):i&&i.add(f)}const s=P(t,{},o);if(!i)return s;for(const f of i)N.reachCopy(s,e,f);const u=void 0!==r.nullOverride&&r.nullOverride;return U(s,e,{nullOverride:u,mergeArrays:!1})},N.reachCopy=function(t,e,r){for(const i of r){if(!(i in e))return;const t=e[i];if("object"!=typeof t||null===t)return;e=t}const n=e;let o=t;for(let i=0;i<r.length-1;++i){const t=r[i];"object"!=typeof o[t]&&(o[t]={}),o=o[t]}o[r[r.length-1]]=n};var D,z,$,q=D={};function F(){throw new Error("setTimeout has not been defined")}function W(){throw new Error("clearTimeout has not been defined")}function H(t){if(z===setTimeout)return setTimeout(t,0);if((z===F||!z)&&setTimeout)return z=setTimeout,setTimeout(t,0);try{return z(t,0)}catch(e){try{return z.call(null,t,0)}catch(e){return z.call(this,t,0)}}}!function(){try{z="function"==typeof setTimeout?setTimeout:F}catch(e){z=F}try{$="function"==typeof clearTimeout?clearTimeout:W}catch(e){$=W}}();var Y,J=[],V=!1,X=-1;function K(){V&&Y&&(V=!1,Y.length?J=Y.concat(J):X=-1,J.length&&G())}function G(){if(!V){var t=H(K);V=!0;for(var r=J.length;r;){for(Y=J,J=[];++X<r;)Y&&Y[X].run();X=-1,r=J.length}Y=null,V=!1,function(t){if($===clearTimeout)return clearTimeout(t);if(($===W||!$)&&clearTimeout)return $=clearTimeout,clearTimeout(t);try{$(t)}catch(e){try{return $.call(null,t)}catch(e){return $.call(this,t)}}}(t)}}function Z(t,e){this.fun=t,this.array=e}function Q(){}q.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];J.push(new Z(t,e)),1!==J.length||V||H(G)},Z.prototype.run=function(){this.fun.apply(null,this.array)},q.title="browser",q.browser=!0,q.env={},q.argv=[],q.version="",q.versions={},q.on=Q,q.addListener=Q,q.once=Q,q.off=Q,q.removeListener=Q,q.removeAllListeners=Q,q.emit=Q,q.prependListener=Q,q.prependOnceListener=Q,q.listeners=function(t){return[]},q.binding=function(t){throw new Error("process.binding is not supported")},q.cwd=function(){return"/"},q.chdir=function(t){throw new Error("process.chdir is not supported")},q.umask=function(){return 0};var tt={};(function(t){(function(){"use strict";const e={};tt=e.Bench=class{constructor(){this.ts=0,this.reset()}reset(){this.ts=e.Bench.now()}elapsed(){return e.Bench.now()-this.ts}static now(){const e=t.hrtime();return 1e3*e[0]+e[1]/1e6}}}).call(this)}).call(this,D);var et=function(){},rt={};(function(t){(function(){"use strict";const e={mismatched:null};rt=function(t,r,n){return n=Object.assign({prototype:!0},n),!!e.isDeepEqual(t,r,n,[])},e.isDeepEqual=function(r,n,o,i){if(r===n)return 0!==r||1/r==1/n;const s=typeof r;if(s!==typeof n)return!1;if(null===r||null===n)return!1;if("function"===s){if(!o.deepFunction||r.toString()!==n.toString())return!1}else if("object"!==s)return r!=r&&n!=n;const u=e.getSharedType(r,n,!!o.prototype);switch(u){case C.buffer:return t&&t.prototype.equals.call(r,n);case C.promise:return r===n;case C.regex:return r.toString()===n.toString();case e.mismatched:return!1}for(let t=i.length-1;t>=0;--t)if(i[t].isSame(r,n))return!0;i.push(new e.SeenEntry(r,n));try{return!!e.isDeepEqualObj(u,r,n,o,i)}finally{i.pop()}},e.getSharedType=function(t,r,n){if(n)return Object.getPrototypeOf(t)!==Object.getPrototypeOf(r)?e.mismatched:C.getInternalProto(t);const o=C.getInternalProto(t);return o!==C.getInternalProto(r)?e.mismatched:o},e.valueOf=function(t){const e=t.valueOf;if(void 0===e)return t;try{return e.call(t)}catch(r){return r}},e.hasOwnEnumerableProperty=function(t,e){return Object.prototype.propertyIsEnumerable.call(t,e)},e.isSetSimpleEqual=function(t,e){for(const r of Set.prototype.values.call(t))if(!Set.prototype.has.call(e,r))return!1;return!0},e.isDeepEqualObj=function(t,r,n,o,i){const{isDeepEqual:s,valueOf:u,hasOwnEnumerableProperty:f}=e,{keys:a,getOwnPropertySymbols:c}=Object;if(t===C.array){if(!o.part){if(r.length!==n.length)return!1;for(let t=0;t<r.length;++t)if(!s(r[t],n[t],o,i))return!1;return!0}for(const t of r)for(const e of n)if(s(t,e,o,i))return!0}else if(t===C.set){if(r.size!==n.size)return!1;if(!e.isSetSimpleEqual(r,n)){const t=new Set(Set.prototype.values.call(n));for(const e of Set.prototype.values.call(r)){if(t.delete(e))continue;let r=!1;for(const n of t)if(s(e,n,o,i)){t.delete(n),r=!0;break}if(!r)return!1}}}else if(t===C.map){if(r.size!==n.size)return!1;for(const[t,e]of Map.prototype.entries.call(r)){if(void 0===e&&!Map.prototype.has.call(n,t))return!1;if(!s(e,Map.prototype.get.call(n,t),o,i))return!1}}else if(t===C.error&&(r.name!==n.name||r.message!==n.message))return!1;const l=u(r),h=u(n);if((r!==l||n!==h)&&!s(l,h,o,i))return!1;const p=a(r);if(!o.part&&p.length!==a(n).length&&!o.skip)return!1;let y=0;for(const e of p)if(o.skip&&o.skip.includes(e))void 0===n[e]&&++y;else{if(!f(n,e))return!1;if(!s(r[e],n[e],o,i))return!1}if(!o.part&&p.length-y!==a(n).length)return!1;if(!1!==o.symbols){const t=c(r),e=new Set(c(n));for(const u of t){if(!o.skip||!o.skip.includes(u))if(f(r,u)){if(!f(n,u))return!1;if(!s(r[u],n[u],o,i))return!1}else if(f(n,u))return!1;e.delete(u)}for(const r of e)if(f(n,r))return!1}return!0},e.SeenEntry=class{constructor(t,e){this.obj=t,this.ref=e}isSame(t,e){return this.obj===t&&this.ref===e}}}).call(this)}).call(this,n({}).Buffer);var nt,ot=function(t){return t.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g,"\\$&")};const it={};nt=function(t,e,r={}){return"object"!=typeof e&&(e=[e]),E(!Array.isArray(e)||e.length,"Values array cannot be empty"),"string"==typeof t?it.string(t,e,r):Array.isArray(t)?it.array(t,e,r):(E("object"==typeof t,"Reference must be string or an object"),it.object(t,e,r))},it.array=function(t,e,r){if(Array.isArray(e)||(e=[e]),!t.length)return!1;if(r.only&&r.once&&t.length!==e.length)return!1;let n;const o=new Map;for(const s of e)if(r.deep&&s&&"object"==typeof s){n=n||it.compare(r);let t=!1;for(const[e,r]of o.entries())if(n(e,s)){++r.allowed,t=!0;break}t||o.set(s,{allowed:1,hits:0})}else{const t=o.get(s);t?++t.allowed:o.set(s,{allowed:1,hits:0})}let i=0;for(const s of t){let t;if(r.deep&&s&&"object"==typeof s){n=n||it.compare(r);for(const[e,r]of o.entries())if(n(e,s)){t=r;break}}else t=o.get(s);if(t&&(++t.hits,++i,r.once&&t.hits>t.allowed))return!1}if(r.only&&i!==t.length)return!1;for(const s of o.values())if(s.hits!==s.allowed&&s.hits<s.allowed&&!r.part)return!1;return!!i},it.object=function(t,e,r){E(void 0===r.once,"Cannot use option once with object");const n=I.keys(t,r);if(!n.length)return!1;if(Array.isArray(e))return it.array(n,e,r);const o=Object.getOwnPropertySymbols(e).filter(t=>e.propertyIsEnumerable(t)),i=[...Object.keys(e),...o],s=it.compare(r),u=new Set(i);for(const f of n)if(u.has(f)){if(!s(e[f],t[f]))return!1;u.delete(f)}else if(r.only)return!1;return!u.size||!!r.part&&u.size<i.length},it.string=function(t,e,r){if(""===t)return 1===e.length&&""===e[0]||!r.once&&!e.some(t=>""!==t);const n=new Map,o=[];for(const f of e)if(E("string"==typeof f,"Cannot compare string reference to non-string value"),f){const t=n.get(f);t?++t.allowed:(n.set(f,{allowed:1,hits:0}),o.push(ot(f)))}else if(r.once||r.only)return!1;if(!o.length)return!0;const i=new RegExp(`(${o.join("|")})`,"g"),s=t.replace(i,(t,e)=>(++n.get(e).hits,""));if(r.only&&s)return!1;let u=!1;for(const f of n.values())if(f.hits&&(u=!0),f.hits!==f.allowed){if(f.hits<f.allowed&&!r.part)return!1;if(r.once)return!1}return!!u},it.compare=function(t){if(!t.deep)return it.shallow;const e=void 0!==t.only,r=void 0!==t.part,n={prototype:e?t.only:!!r&&!t.part,part:e?!t.only:!!r&&t.part};return(t,e)=>rt(t,e,n)},it.shallow=function(t,e){return t===e};var st;const ut={};st=function(t){if(!t)return"";let e="";for(let r=0;r<t.length;++r){const n=t.charCodeAt(r);ut.isSafe(n)?e+=t[r]:e+=ut.escapeHtmlChar(n)}return e},ut.escapeHtmlChar=function(t){const e=ut.namedHtml[t];return void 0!==e?e:t>=256?"&#"+t+";":`&#x${t.toString(16).padStart(2,"0")};`},ut.isSafe=function(t){return void 0!==ut.safeCharCodes[t]},ut.namedHtml={38:"&amp;",60:"&lt;",62:"&gt;",34:"&quot;",160:"&nbsp;",162:"&cent;",163:"&pound;",164:"&curren;",169:"&copy;",174:"&reg;"},ut.safeCharCodes=function(){const t={};for(let e=32;e<123;++e)(e>=97||e>=65&&e<=90||e>=48&&e<=57||32===e||46===e||44===e||45===e||58===e||95===e)&&(t[e]=null);return t}();const ft={};var at,ct=ft.flatten=function(t,e){const r=e||[];for(let n=0;n<t.length;++n)Array.isArray(t[n])?ft.flatten(t[n],r):r.push(t[n]);return r};const lt={};at=function(t,e,r={}){if(!t||!e)return r.first?null:[];const n=[],o=Array.isArray(t)?new Set(t):t,i=new Set;for(const s of e)if(lt.has(o,s)&&!i.has(s)){if(r.first)return s;n.push(s),i.add(s)}return r.first?null:n},lt.has=function(t,e){return"function"==typeof t.has?t.has(e):void 0!==t[e]};var ht={};ht.applyToDefaults=R,ht.assert=E,ht.Bench=tt,ht.block=function(){return new Promise(et)},ht.clone=P,ht.contain=nt,ht.deepEqual=rt,ht.Error=w,ht.escapeHeaderAttribute=function(t){return E(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(t),"Bad attribute value ("+t+")"),t.replace(/\\/g,"\\\\").replace(/\"/g,'\\"')},ht.escapeHtml=st,ht.escapeJson=function(t){if(!t)return"";let e;return t.replace(/[<>&\u2028\u2029]/g,t=>60===(e=t.charCodeAt(0))?"\\u003c":62===e?"\\u003e":38===e?"\\u0026":8232===e?"\\u2028":"\\u2029")},ht.escapeRegex=ot,ht.flatten=ct,ht.ignore=et,ht.intersect=at,ht.isPromise=function(t){return!!t&&"function"==typeof t.then},ht.merge=U,ht.once=function(t){if(t._hoekOnce)return t;let e=!1;const r=function(...r){e||(e=!0,t(...r))};return r._hoekOnce=!0,r},ht.reach=b,ht.reachTemplate=function(t,e,r){return e.replace(/{([^{}]+)}/g,(e,n)=>{const o=b(t,n,r);return null==o?"":o})},ht.stringify=m,ht.wait=function(t,e){if("number"!=typeof t&&void 0!==t)throw new TypeError("Timeout must be a number");return new Promise(r=>setTimeout(r,t,e))};var pt={exports:{}};(function(t){(function(){!function(e){"object"==typeof pt.exports?pt.exports=e():("undefined"!=typeof window?window:void 0!==t?t:"undefined"!=typeof self?self:this).Nua=e()}((function(){return function(t,e,r){var n=(r=r||{}).depth||Number.MAX_VALUE,o=r.setter,i=!!r.preserve;"object"==typeof t&&"object"==typeof e&&function t(e,r,s){if(!(null==e||null==r||n<=s)){var u=s+1;if(Array.isArray(e)&&Array.isArray(r)){for(var f=0;f<e.length;f++)"object"==typeof e[f]?t(e[f],r[f],u):o?o(e,f,r[f]):e[f]=r[f];for(;f<r.length;f++)o?o(e,f,r[f]):e[f]=r[f];e.splice(r.length)}else{for(var a=Object.keys(e),c=0;c<a.length;c++){var l=e[a[c]],h=r[a[c]];"object"==(null===l?"null":typeof l)&&"object"==(null===h?"null":typeof h)?t(l,h,u):void 0===h?i||delete e[a[c]]:o?o(e,a[c],h):e[a[c]]=h}for(var p=Object.keys(r),y=0;y<p.length;y++)void 0===e[p[y]]&&(o?(o(e,p[y],r[p[y]]),null==r[p[y]]||!Array.isArray(r[p[y]])&&"object"!=typeof r[p[y]]||t(e[p[y]],r[p[y]],u)):e[p[y]]=r[p[y]])}}}(t,e,0)}}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),pt=pt.exports;var yt={},gt=this&&this.__createBinding||(Object.create?function(t,e,r,n){void 0===n&&(n=r),Object.defineProperty(t,n,{enumerable:!0,get:function(){return e[r]}})}:function(t,e,r,n){void 0===n&&(n=r),t[n]=e[r]}),dt=this&&this.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),vt=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)"default"!==r&&Object.prototype.hasOwnProperty.call(t,r)&&gt(e,t,r);return dt(e,t),e},mt=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(yt,"__esModule",{value:!0}),yt.LegacyOrdu=yt.Ordu=void 0;const wt=vt(ht),bt=mt(pt);class Et{constructor(t){var e;this.runid=null==t.id?(""+Math.random()).substring(2):t.id,this.name=t.name||"task"+Et.count++,this.before=t.before,this.after=t.after,this.exec=t.exec||(t=>{}),this.if=t.if||void 0,this.active=null==t.active||t.active,this.meta=Object.assign(t.meta||{},{when:Date.now(),from:t.from||{callpoint:(e=new Error,null==e?[]:(e.stack||"").split(/\n/).slice(4).map(t=>t.substring(4)))}})}}Et.count=0;class _t{constructor(t,e,r,n){this.op="not-defined",this.task=t,this.name=t.name,this.start=Date.now(),this.end=Number.MAX_SAFE_INTEGER,this.index=e,this.total=r,this.async=!1,this.runid=n}update(t){t=null==t?{}:t,this.out=null==t.out?{}:t.out,this.err=t instanceof Error?t:t.err,this.op=null!=this.err?"stop":"string"==typeof t.op?t.op:"next",this.why=t.why||""}}function At(t,e){for(var r=0;r<e.length;++r)if(-1===t.indexOf(e[r]))return!1;return!0}return yt.Ordu=class extends o.EventEmitter{constructor(t){super(),this.task={},this._opts={debug:!1,...t},this._tasks=[],this._operator_map={next:()=>({stop:!1}),skip:()=>({stop:!1}),stop:(t,e,r)=>((0,bt.default)(r,t.out,{preserve:!0}),{stop:!0,err:t.err}),merge:(t,e,r)=>((0,bt.default)(r,t.out,{preserve:!0}),{stop:!1})}}operator(t,e){let r="string"==typeof t?t:t.name;this._operator_map[r]=e||t}operators(){return this._operator_map}add(t,e){if("function"==typeof t){let r=e=e||{};r.exec=t,r.name=t.name?t.name:r.name,this._add_task(r)}else if(Array.isArray(t))for(var r=0;r<t.length;r++){let e=t[r];"function"==typeof t[r]&&(e={name:t[r].name,exec:t[r]}),this._add_task(e)}else this._add_task(t);return this}_add_task(t){let e=new Et(t),r=0;for(;r<this._tasks.length&&(null==e.before||this._tasks[r].name!==e.before);r++)if(null!=e.after&&this._tasks[r].name===e.after){r++;break}this._tasks.splice(r,0,e),this.task[e.name]=e}execSync(t,e,r){return this.exec(t,e,r)}async exec(t,e,r){let n=(r=null==r?{}:r).runid||(Math.random()+"").substring(2),o=Date.now(),i=[...this._tasks],s={ctx:t||{},data:e||{}},u={stop:!1,err:void 0,async:!1},f=[],a=0,c=0;for(;c<i.length;c++){let t=i[c],e=null,r=new _t(t,c,i.length,n);if(t.active&&this._task_if(t,s.data))try{a++;let n=Object.assign({task:t},s);(e=t.exec(n))instanceof Promise&&(r.async=!0,e=await e)}catch(h){e=h}else e={op:"skip"};r.end=Date.now(),r.update(e),this.emit("task-result",r);try{let t=this._operate(r,s.ctx,s.data);t instanceof Promise?(u=await t).async=!0:(u=t).async=!1,u.err=u.err||void 0}catch(p){u={stop:!0,err:p,async:!1}}let o={name:t.name,op:r.op,task:t,result:r,operate:u,data:this._opts.debug?JSON.parse(JSON.stringify(s.data)):void 0};if(f.push(o),this.emit("task-end",o),u.stop)break}let l={tasklog:f,task:u.err?i[c]:void 0,task_count:a,task_total:i.length,start:o,end:Date.now(),err:u.err,data:s.data};return r.done&&r.done(l),l}tasks(){return[...this._tasks]}_operate(t,e,r){if(t.err)return{stop:!0,err:t.err,async:!1};let n=this._operator_map[t.op];return n?n(t,e,r):{stop:!0,err:new Error("Unknown operation: "+t.op),async:!1}}_task_if(t,e){if(t.if){let r=t.if;return Object.keys(r).reduce((t,n)=>{let o=wt.reach(e,n);return t&&wt.contain({$:o},{$:r[n]},{deep:!0})},!0)}return!0}},yt.LegacyOrdu=function(t){var e={};(t=t||{}).name=t.name||"ordu0",e.add=function(n,o){return(o=o||n).name||Object.defineProperty(o,"name",{value:t.name+"_task"+r.length}),o.tags=n.tags||[],r.push(o),e},e.process=function(){var t=arguments.length,e=0<t&&arguments[--t],n=0<t&&arguments[--t],o=0<t&&arguments[--t];e=e||{},n=n||{},(o=o||{}).tags=o.tags||[];for(var i=0;i<r.length;++i){var s=r[i];if(!(0<o.tags.length)||At(s.tags,o.tags)){var u=i,f=s.name;n.index$=u,n.taskname$=f;var a=s(n,e);if(a)return a.index$=u,a.taskname$=f,a.ctxt$=n,a.data$=e,a}}return null},e.tasknames=function(){return r.map((function(t){return t.name}))},e.taskdetails=function(){return r.map((function(t){return t.name+":{tags:"+t.tags+"}"}))},e.toString=function(){return t.name+":["+e.tasknames()+"]"};var r=[];return e},yt}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
(function (Buffer,__dirname){(function (){
'use strict';

const Util = require('util');

const Hoek = require('@hapi/hoek');


const internals = {
    flags: ['not', 'once', 'only', 'part', 'shallow'],
    grammar: ['a', 'an', 'and', 'at', 'be', 'have', 'in', 'to'],
    locations: {},
    count: 0
};


// Global settings

exports.settings = {
    truncateMessages: false,
    comparePrototypes: false
};


// Utilities

exports.fail = function (message) {

    throw new Error(message);
};


exports.count = function () {

    return internals.count;
};


exports.incomplete = function () {

    const locations = Object.keys(internals.locations);
    return locations.length ? locations : null;
};


internals.atNamedRx = /^\s*at (?:async )?[^(/]*\(?(.+)\:(\d+)\:(\d+)\)?$/;


internals.atUnnamedRx = /^\s*at (?:async )?(.+)\:(\d+)\:(\d+)\)?$/;


exports.thrownAt = function (error) {

    error = error || new Error();
    const stack = typeof error.stack === 'string' ? error.stack : '';
    const frame = stack.replace(error.toString(), '').split('\n').slice(1).filter(internals.filterLocal)[0] || '';
    const at = frame.match(frame.includes('(') ? internals.atNamedRx : internals.atUnnamedRx);
    return Array.isArray(at) ? {
        filename: at[1],
        line: at[2],
        column: at[3]
    } : undefined;
};


internals.filterLocal = function (line) {

    return line.indexOf(__dirname) === -1;
};


// Expect interface

exports.expect = function (value, prefix) {

    const at = exports.thrownAt();
    const location = at.filename + ':' + at.line + '.' + at.column;
    internals.locations[location] = true;
    ++internals.count;
    return new internals.Assertion(value, prefix, location, at);
};


internals.Assertion = function (ref, prefix, location, at) {

    this._ref = ref;
    this._prefix = prefix || '';
    this._location = location;
    this._at = at;
    this._flags = {};
};


internals.Assertion.prototype.assert = function (result, verb, actual, expected) {

    delete internals.locations[this._location];

    if (this._flags.not ? !result : result) {
        this._flags = {};
        return this;
    }

    if (verb === 'exist' &&
        this._flags.not &&
        this._ref instanceof Error) {

        const original = this._ref;
        original.at = exports.thrownAt();

        throw original;
    }

    let message = '';

    if (this._prefix) {
        message += this._prefix + ': ';
    }

    message += 'Expected ' + internals.display(this._ref) + ' to ';

    if (this._flags.not) {
        message += 'not ';
    }

    message += verb;

    if (this._flags.once) {
        message += ' once';
    }

    if (arguments.length === 3) {           // 'actual' without 'expected'
        message += ' but got ' + internals.display(actual);
    }

    const error = new Error(message);
    Error.captureStackTrace(error, this.assert);
    error.actual = actual;
    error.expected = expected;
    error.at = exports.thrownAt(error) || this._at;
    throw error;
};


internals.flags.forEach((word) => {

    Object.defineProperty(internals.Assertion.prototype, word, {
        get: function () {

            this._flags[word] = !this._flags[word];
            return this;
        },
        configurable: true
    });
});


internals.grammar.forEach((word) => {

    Object.defineProperty(internals.Assertion.prototype, word, {
        get: function () {

            return this;
        },
        configurable: true
    });
});


internals.addMethod = function (names, fn) {

    const method = function (name) {

        internals.Assertion.prototype[name] = fn;
    };

    names = [].concat(names);
    names.forEach(method);
};


['arguments', 'array', 'boolean', 'buffer', 'date', 'function', 'number', 'regexp', 'string', 'object'].forEach((word) => {

    const article = ['a', 'e', 'i', 'o', 'u'].indexOf(word[0]) !== -1 ? 'an ' : 'a ';
    const method = function () {

        const type = internals.type(this._ref);
        return this.assert(type === word, 'be ' + article + word, type);
    };

    internals.addMethod(word, method);
});


internals.addMethod('error', function (...args /* type, message */) {

    const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : Error;
    const lastArg = args[1] || args[0];
    const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;
    const err = this._ref;

    if (!this._flags.not ||
        message === null) {

        this.assert(err instanceof type, 'be an error with ' + (type.name || 'provided') + ' type');
    }

    if (message !== null) {
        const error = err.message || '';
        this.assert(typeof message === 'string' ? error === message : error.match(message), 'be an error with specified message', error, message);
    }
});


[true, false, null, undefined].forEach((value) => {

    const name = Util.inspect(value);
    const method = function () {

        return this.assert(this._ref === value, 'be ' + name);
    };

    internals.addMethod(name, method);
});


internals.nan = function () {

    return this.assert(Number.isNaN(this._ref), 'be NaN');
};

internals.addMethod('NaN', internals.nan);


internals.include = function (value) {

    internals.assert(this, arguments.length === 1, 'Can only assert include with a single parameter');

    this._flags.deep = !this._flags.shallow;
    this._flags.part = this._flags.hasOwnProperty('part') ? this._flags.part : false;
    return this.assert(Hoek.contain(this._ref, value, this._flags), 'include ' + internals.display(value));
};

internals.addMethod(['include', 'includes', 'contain', 'contains'], internals.include);


internals.endWith = function (value) {

    internals.assert(this, typeof this._ref === 'string' && typeof value === 'string', 'Can only assert endsWith on a string, with a string');

    const comparator = this._ref.slice(-value.length);
    return this.assert(comparator === value, 'endWith ' + internals.display(value));
};

internals.addMethod(['endWith', 'endsWith'], internals.endWith);


internals.startWith = function (value) {

    internals.assert(this, typeof this._ref === 'string' && typeof value === 'string', 'Can only assert startsWith on a string, with a string');

    const comparator = this._ref.slice(0, value.length);
    return this.assert(comparator === value, 'startWith ' + internals.display(value));
};

internals.addMethod(['startWith', 'startsWith'], internals.startWith);


internals.exist = function () {

    return this.assert(this._ref !== null && this._ref !== undefined, 'exist');
};

internals.addMethod(['exist', 'exists'], internals.exist);


internals.empty = function () {

    internals.assert(this, typeof this._ref === 'object' || typeof this._ref === 'string', 'Can only assert empty on object, array or string');

    const length = this._ref.length !== undefined ? this._ref.length : Object.keys(this._ref).length;
    return this.assert(!length, 'be empty');
};

internals.addMethod('empty', internals.empty);


internals.length = function (size) {

    internals.assert(this, (typeof this._ref === 'object' && this._ref !== null) || typeof this._ref === 'string', 'Can only assert length on object, array or string');

    const length = this._ref.length !== undefined ? this._ref.length : Object.keys(this._ref).length;
    return this.assert(length === size, 'have a length of ' + size, length);
};

internals.addMethod('length', internals.length);


internals.equal = function (value, options) {

    options = options || {};
    const settings = Hoek.applyToDefaults({ prototype: exports.settings.comparePrototypes, deepFunction: true }, options);

    const compare = this._flags.shallow ? (a, b) => a === b
        : (a, b) => Hoek.deepEqual(a, b, settings);

    return this.assert(compare(this._ref, value), `equal specified value: ${internals.display(value)}`, this._ref, value);
};

internals.addMethod(['equal', 'equals'], internals.equal);


internals.above = function (value) {

    return this.assert(this._ref > value, 'be above ' + value);
};

internals.addMethod(['above', 'greaterThan'], internals.above);


internals.least = function (value) {

    return this.assert(this._ref >= value, 'be at least ' + value);
};

internals.addMethod(['least', 'min'], internals.least);


internals.below = function (value) {

    return this.assert(this._ref < value, 'be below ' + value);
};

internals.addMethod(['below', 'lessThan'], internals.below);


internals.most = function (value) {

    return this.assert(this._ref <= value, 'be at most ' + value);
};

internals.addMethod(['most', 'max'], internals.most);


internals.within = function (from, to) {

    return this.assert(this._ref >= from && this._ref <= to, 'be within ' + from + '..' + to);
};

internals.addMethod(['within', 'range'], internals.within);


internals.between = function (from, to) {

    return this.assert(this._ref > from && this._ref < to, 'be between ' + from + '..' + to);
};

internals.addMethod('between', internals.between);


internals.above = function (value, delta) {

    internals.assert(this, internals.type(this._ref) === 'number', 'Can only assert about on numbers');
    internals.assert(this, internals.type(value) === 'number' && internals.type(delta) === 'number', 'About assertion requires two number arguments');

    return this.assert(Math.abs(this._ref - value) <= delta, 'be about ' + value + ' \u00b1' + delta);
};

internals.addMethod('about', internals.above);


internals.instanceof = function (type) {

    return this.assert(this._ref instanceof type, 'be an instance of ' + (type.name || 'provided type'));
};

internals.addMethod(['instanceof', 'instanceOf'], internals.instanceof);


internals.match = function (regex) {

    return this.assert(regex.exec(this._ref), 'match ' + regex);
};

internals.addMethod(['match', 'matches'], internals.match);


internals.satisfy = function (validator) {

    return this.assert(validator(this._ref), 'satisfy rule');
};

internals.addMethod(['satisfy', 'satisfies'], internals.satisfy);


internals.throw = function (...args /* type, message */) {

    internals.assert(this, typeof this._ref === 'function', 'Can only assert throw on functions');
    internals.assert(this, !this._flags.not || !args.length, 'Cannot specify arguments when expecting not to throw');

    const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : null;
    const lastArg = args[1] || args[0];
    const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;

    let thrown = false;

    try {
        this._ref();
    }
    catch (err) {
        thrown = true;

        if (type) {
            this.assert(err instanceof type, 'throw ' + (type.name || 'provided type'));
        }

        if (message !== null) {
            const error = err.message || '';
            this.assert(typeof message === 'string' ? error === message : error.match(message), 'throw an error with specified message', error, message);
        }

        this.assert(thrown, 'throw an error', err);
        return err;
    }

    return this.assert(thrown, 'throw an error');
};

internals.addMethod(['throw', 'throws'], internals.throw);


internals.reject = async function (...args/* type, message */) {

    try {
        internals.assert(this, internals.isPromise(this._ref), 'Can only assert reject on promises');

        const type = args.length && typeof args[0] !== 'string' && !(args[0] instanceof RegExp) ? args[0] : null;
        const lastArg = args[1] || args[0];
        const message = typeof lastArg === 'string' || lastArg instanceof RegExp ? lastArg : null;

        let thrown = null;
        try {
            await this._ref;
        }
        catch (err) {
            thrown = err;
        }

        internals.assert(this, !this._flags.not || !arguments.length, 'Cannot specify arguments when expecting not to reject');

        if (thrown) {

            internals.assert(this, arguments.length < 2 || message, 'Can not assert with invalid message argument type');
            internals.assert(this, arguments.length < 1 || message !== null || typeof type === 'function', 'Can not assert with invalid type argument');

            if (type) {
                this.assert(thrown instanceof type, 'reject with ' + (type.name || 'provided type'));
            }

            if (message !== null) {
                const error = thrown.message || '';
                this.assert(typeof message === 'string' ? error === message : error.match(message), 'reject with an error with specified message', error, message);
            }

            this.assert(thrown, 'reject with an error', thrown);
        }

        this.assert(thrown, 'reject with an error');
        return thrown;
    }
    catch (err) {
        return new Promise((resolve, reject) => {

            reject(err);
        });
    }
};

internals.addMethod(['reject', 'rejects'], internals.reject);


internals.isPromise = function (promise) {

    return promise && typeof promise.then === 'function';
};


internals.display = function (value) {

    const string = value instanceof Error
        ? `[${value.toString()}]`
        : internals.isPromise(value)
            ? '[Promise]'
            : typeof value === 'function'
                ? '[Function]'
                : Util.inspect(value);

    if (!exports.settings.truncateMessages ||
        string.length <= 40) {

        return string;
    }

    if (Array.isArray(value)) {
        return '[Array(' + value.length + ')]';
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        return '{ Object (' + (keys.length > 2 ? (keys.splice(0, 2).join(', ') + ', ...') : keys.join(', ')) + ') }';
    }

    return string.slice(0, 40) + '...\'';
};


internals.natives = {
    '[object Arguments]': 'arguments',
    '[object Array]': 'array',
    '[object AsyncFunction]': 'function',
    '[object Date]': 'date',
    '[object Function]': 'function',
    '[object Number]': 'number',
    '[object RegExp]': 'regexp',
    '[object String]': 'string'
};


internals.type = function (value) {

    if (value === null) {
        return 'null';
    }

    if (value === undefined) {
        return 'undefined';
    }

    if (Buffer.isBuffer(value)) {
        return 'buffer';
    }

    const name = Object.prototype.toString.call(value);
    if (internals.natives[name]) {
        return internals.natives[name];
    }

    if (value === Object(value)) {
        return 'object';
    }

    return typeof value;
};


internals.assert = function (assertion, condition, error) {

    if (!condition) {
        delete internals.locations[assertion._location];
        Hoek.assert(condition, error);
    }
};

}).call(this)}).call(this,{"isBuffer":require("../../../../../../../.npm-global/lib/node_modules/browserify/node_modules/is-buffer/index.js")},"/node_modules/@hapi/code/lib")
},{"../../../../../../../.npm-global/lib/node_modules/browserify/node_modules/is-buffer/index.js":19,"@hapi/hoek":44,"util":26}],30:[function(require,module,exports){
'use strict';

const Assert = require('./assert');
const Clone = require('./clone');
const Merge = require('./merge');
const Reach = require('./reach');


const internals = {};


module.exports = function (defaults, source, options = {}) {

    Assert(defaults && typeof defaults === 'object', 'Invalid defaults value: must be an object');
    Assert(!source || source === true || typeof source === 'object', 'Invalid source value: must be true, falsy or an object');
    Assert(typeof options === 'object', 'Invalid options: must be an object');

    if (!source) {                                                  // If no source, return null
        return null;
    }

    if (options.shallow) {
        return internals.applyToDefaultsWithShallow(defaults, source, options);
    }

    const copy = Clone(defaults);

    if (source === true) {                                          // If source is set to true, use defaults
        return copy;
    }

    const nullOverride = options.nullOverride !== undefined ? options.nullOverride : false;
    return Merge(copy, source, { nullOverride, mergeArrays: false });
};


internals.applyToDefaultsWithShallow = function (defaults, source, options) {

    const keys = options.shallow;
    Assert(Array.isArray(keys), 'Invalid keys');

    const seen = new Map();
    const merge = source === true ? null : new Set();

    for (let key of keys) {
        key = Array.isArray(key) ? key : key.split('.');            // Pre-split optimization

        const ref = Reach(defaults, key);
        if (ref &&
            typeof ref === 'object') {

            seen.set(ref, merge && Reach(source, key) || ref);
        }
        else if (merge) {
            merge.add(key);
        }
    }

    const copy = Clone(defaults, {}, seen);

    if (!merge) {
        return copy;
    }

    for (const key of merge) {
        internals.reachCopy(copy, source, key);
    }

    const nullOverride = options.nullOverride !== undefined ? options.nullOverride : false;
    return Merge(copy, source, { nullOverride, mergeArrays: false });
};


internals.reachCopy = function (dst, src, path) {

    for (const segment of path) {
        if (!(segment in src)) {
            return;
        }

        const val = src[segment];

        if (typeof val !== 'object' || val === null) {
            return;
        }

        src = val;
    }

    const value = src;
    let ref = dst;
    for (let i = 0; i < path.length - 1; ++i) {
        const segment = path[i];
        if (typeof ref[segment] !== 'object') {
            ref[segment] = {};
        }

        ref = ref[segment];
    }

    ref[path[path.length - 1]] = value;
};

},{"./assert":31,"./clone":34,"./merge":47,"./reach":49}],31:[function(require,module,exports){
'use strict';

const AssertError = require('./error');

const internals = {};


module.exports = function (condition, ...args) {

    if (condition) {
        return;
    }

    if (args.length === 1 &&
        args[0] instanceof Error) {

        throw args[0];
    }

    throw new AssertError(args);
};

},{"./error":37}],32:[function(require,module,exports){
(function (process){(function (){
'use strict';

const internals = {};


module.exports = internals.Bench = class {

    constructor() {

        this.ts = 0;
        this.reset();
    }

    reset() {

        this.ts = internals.Bench.now();
    }

    elapsed() {

        return internals.Bench.now() - this.ts;
    }

    static now() {

        const ts = process.hrtime();
        return (ts[0] * 1e3) + (ts[1] / 1e6);
    }
};

}).call(this)}).call(this,require('_process'))
},{"_process":22}],33:[function(require,module,exports){
'use strict';

const Ignore = require('./ignore');


const internals = {};


module.exports = function () {

    return new Promise(Ignore);
};

},{"./ignore":43}],34:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Reach = require('./reach');
const Types = require('./types');
const Utils = require('./utils');


const internals = {
    needsProtoHack: new Set([Types.set, Types.map, Types.weakSet, Types.weakMap])
};


module.exports = internals.clone = function (obj, options = {}, _seen = null) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    let clone = internals.clone;
    let seen = _seen;

    if (options.shallow) {
        if (options.shallow !== true) {
            return internals.cloneWithShallow(obj, options);
        }

        clone = (value) => value;
    }
    else if (seen) {
        const lookup = seen.get(obj);
        if (lookup) {
            return lookup;
        }
    }
    else {
        seen = new Map();
    }

    // Built-in object types

    const baseProto = Types.getInternalProto(obj);
    if (baseProto === Types.buffer) {
        return Buffer && Buffer.from(obj);              // $lab:coverage:ignore$
    }

    if (baseProto === Types.date) {
        return new Date(obj.getTime());
    }

    if (baseProto === Types.regex) {
        return new RegExp(obj);
    }

    // Generic objects

    const newObj = internals.base(obj, baseProto, options);
    if (newObj === obj) {
        return obj;
    }

    if (seen) {
        seen.set(obj, newObj);                              // Set seen, since obj could recurse
    }

    if (baseProto === Types.set) {
        for (const value of obj) {
            newObj.add(clone(value, options, seen));
        }
    }
    else if (baseProto === Types.map) {
        for (const [key, value] of obj) {
            newObj.set(key, clone(value, options, seen));
        }
    }

    const keys = Utils.keys(obj, options);
    for (const key of keys) {
        if (key === '__proto__') {
            continue;
        }

        if (baseProto === Types.array &&
            key === 'length') {

            newObj.length = obj.length;
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor) {
            if (descriptor.get ||
                descriptor.set) {

                Object.defineProperty(newObj, key, descriptor);
            }
            else if (descriptor.enumerable) {
                newObj[key] = clone(obj[key], options, seen);
            }
            else {
                Object.defineProperty(newObj, key, { enumerable: false, writable: true, configurable: true, value: clone(obj[key], options, seen) });
            }
        }
        else {
            Object.defineProperty(newObj, key, {
                enumerable: true,
                writable: true,
                configurable: true,
                value: clone(obj[key], options, seen)
            });
        }
    }

    return newObj;
};


internals.cloneWithShallow = function (source, options) {

    const keys = options.shallow;
    options = Object.assign({}, options);
    options.shallow = false;

    const seen = new Map();

    for (const key of keys) {
        const ref = Reach(source, key);
        if (typeof ref === 'object' ||
            typeof ref === 'function') {

            seen.set(ref, ref);
        }
    }

    return internals.clone(source, options, seen);
};


internals.base = function (obj, baseProto, options) {

    if (options.prototype === false) {                  // Defaults to true
        if (internals.needsProtoHack.has(baseProto)) {
            return new baseProto.constructor();
        }

        return baseProto === Types.array ? [] : {};
    }

    const proto = Object.getPrototypeOf(obj);
    if (proto &&
        proto.isImmutable) {

        return obj;
    }

    if (baseProto === Types.array) {
        const newObj = [];
        if (proto !== baseProto) {
            Object.setPrototypeOf(newObj, proto);
        }

        return newObj;
    }

    if (internals.needsProtoHack.has(baseProto)) {
        const newObj = new proto.constructor();
        if (proto !== baseProto) {
            Object.setPrototypeOf(newObj, proto);
        }

        return newObj;
    }

    return Object.create(proto);
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./reach":49,"./types":52,"./utils":53,"buffer":5}],35:[function(require,module,exports){
'use strict';

const Assert = require('./assert');
const DeepEqual = require('./deepEqual');
const EscapeRegex = require('./escapeRegex');
const Utils = require('./utils');


const internals = {};


module.exports = function (ref, values, options = {}) {        // options: { deep, once, only, part, symbols }

    /*
        string -> string(s)
        array -> item(s)
        object -> key(s)
        object -> object (key:value)
    */

    if (typeof values !== 'object') {
        values = [values];
    }

    Assert(!Array.isArray(values) || values.length, 'Values array cannot be empty');

    // String

    if (typeof ref === 'string') {
        return internals.string(ref, values, options);
    }

    // Array

    if (Array.isArray(ref)) {
        return internals.array(ref, values, options);
    }

    // Object

    Assert(typeof ref === 'object', 'Reference must be string or an object');
    return internals.object(ref, values, options);
};


internals.array = function (ref, values, options) {

    if (!Array.isArray(values)) {
        values = [values];
    }

    if (!ref.length) {
        return false;
    }

    if (options.only &&
        options.once &&
        ref.length !== values.length) {

        return false;
    }

    let compare;

    // Map values

    const map = new Map();
    for (const value of values) {
        if (!options.deep ||
            !value ||
            typeof value !== 'object') {

            const existing = map.get(value);
            if (existing) {
                ++existing.allowed;
            }
            else {
                map.set(value, { allowed: 1, hits: 0 });
            }
        }
        else {
            compare = compare || internals.compare(options);

            let found = false;
            for (const [key, existing] of map.entries()) {
                if (compare(key, value)) {
                    ++existing.allowed;
                    found = true;
                    break;
                }
            }

            if (!found) {
                map.set(value, { allowed: 1, hits: 0 });
            }
        }
    }

    // Lookup values

    let hits = 0;
    for (const item of ref) {
        let match;
        if (!options.deep ||
            !item ||
            typeof item !== 'object') {

            match = map.get(item);
        }
        else {
            compare = compare || internals.compare(options);

            for (const [key, existing] of map.entries()) {
                if (compare(key, item)) {
                    match = existing;
                    break;
                }
            }
        }

        if (match) {
            ++match.hits;
            ++hits;

            if (options.once &&
                match.hits > match.allowed) {

                return false;
            }
        }
    }

    // Validate results

    if (options.only &&
        hits !== ref.length) {

        return false;
    }

    for (const match of map.values()) {
        if (match.hits === match.allowed) {
            continue;
        }

        if (match.hits < match.allowed &&
            !options.part) {

            return false;
        }
    }

    return !!hits;
};


internals.object = function (ref, values, options) {

    Assert(options.once === undefined, 'Cannot use option once with object');

    const keys = Utils.keys(ref, options);
    if (!keys.length) {
        return false;
    }

    // Keys list

    if (Array.isArray(values)) {
        return internals.array(keys, values, options);
    }

    // Key value pairs

    const symbols = Object.getOwnPropertySymbols(values).filter((sym) => values.propertyIsEnumerable(sym));
    const targets = [...Object.keys(values), ...symbols];

    const compare = internals.compare(options);
    const set = new Set(targets);

    for (const key of keys) {
        if (!set.has(key)) {
            if (options.only) {
                return false;
            }

            continue;
        }

        if (!compare(values[key], ref[key])) {
            return false;
        }

        set.delete(key);
    }

    if (set.size) {
        return options.part ? set.size < targets.length : false;
    }

    return true;
};


internals.string = function (ref, values, options) {

    // Empty string

    if (ref === '') {
        return values.length === 1 && values[0] === '' ||               // '' contains ''
            !options.once && !values.some((v) => v !== '');             // '' contains multiple '' if !once
    }

    // Map values

    const map = new Map();
    const patterns = [];

    for (const value of values) {
        Assert(typeof value === 'string', 'Cannot compare string reference to non-string value');

        if (value) {
            const existing = map.get(value);
            if (existing) {
                ++existing.allowed;
            }
            else {
                map.set(value, { allowed: 1, hits: 0 });
                patterns.push(EscapeRegex(value));
            }
        }
        else if (options.once ||
            options.only) {

            return false;
        }
    }

    if (!patterns.length) {                     // Non-empty string contains unlimited empty string
        return true;
    }

    // Match patterns

    const regex = new RegExp(`(${patterns.join('|')})`, 'g');
    const leftovers = ref.replace(regex, ($0, $1) => {

        ++map.get($1).hits;
        return '';                              // Remove from string
    });

    // Validate results

    if (options.only &&
        leftovers) {

        return false;
    }

    let any = false;
    for (const match of map.values()) {
        if (match.hits) {
            any = true;
        }

        if (match.hits === match.allowed) {
            continue;
        }

        if (match.hits < match.allowed &&
            !options.part) {

            return false;
        }

        // match.hits > match.allowed

        if (options.once) {
            return false;
        }
    }

    return !!any;
};


internals.compare = function (options) {

    if (!options.deep) {
        return internals.shallow;
    }

    const hasOnly = options.only !== undefined;
    const hasPart = options.part !== undefined;

    const flags = {
        prototype: hasOnly ? options.only : hasPart ? !options.part : false,
        part: hasOnly ? !options.only : hasPart ? options.part : false
    };

    return (a, b) => DeepEqual(a, b, flags);
};


internals.shallow = function (a, b) {

    return a === b;
};

},{"./assert":31,"./deepEqual":36,"./escapeRegex":41,"./utils":53}],36:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Types = require('./types');


const internals = {
    mismatched: null
};


module.exports = function (obj, ref, options) {

    options = Object.assign({ prototype: true }, options);

    return !!internals.isDeepEqual(obj, ref, options, []);
};


internals.isDeepEqual = function (obj, ref, options, seen) {

    if (obj === ref) {                                                      // Copied from Deep-eql, copyright(c) 2013 Jake Luer, jake@alogicalparadox.com, MIT Licensed, https://github.com/chaijs/deep-eql
        return obj !== 0 || 1 / obj === 1 / ref;
    }

    const type = typeof obj;

    if (type !== typeof ref) {
        return false;
    }

    if (obj === null ||
        ref === null) {

        return false;
    }

    if (type === 'function') {
        if (!options.deepFunction ||
            obj.toString() !== ref.toString()) {

            return false;
        }

        // Continue as object
    }
    else if (type !== 'object') {
        return obj !== obj && ref !== ref;                                  // NaN
    }

    const instanceType = internals.getSharedType(obj, ref, !!options.prototype);
    switch (instanceType) {
        case Types.buffer:
            return Buffer && Buffer.prototype.equals.call(obj, ref);        // $lab:coverage:ignore$
        case Types.promise:
            return obj === ref;
        case Types.regex:
            return obj.toString() === ref.toString();
        case internals.mismatched:
            return false;
    }

    for (let i = seen.length - 1; i >= 0; --i) {
        if (seen[i].isSame(obj, ref)) {
            return true;                                                    // If previous comparison failed, it would have stopped execution
        }
    }

    seen.push(new internals.SeenEntry(obj, ref));

    try {
        return !!internals.isDeepEqualObj(instanceType, obj, ref, options, seen);
    }
    finally {
        seen.pop();
    }
};


internals.getSharedType = function (obj, ref, checkPrototype) {

    if (checkPrototype) {
        if (Object.getPrototypeOf(obj) !== Object.getPrototypeOf(ref)) {
            return internals.mismatched;
        }

        return Types.getInternalProto(obj);
    }

    const type = Types.getInternalProto(obj);
    if (type !== Types.getInternalProto(ref)) {
        return internals.mismatched;
    }

    return type;
};


internals.valueOf = function (obj) {

    const objValueOf = obj.valueOf;
    if (objValueOf === undefined) {
        return obj;
    }

    try {
        return objValueOf.call(obj);
    }
    catch (err) {
        return err;
    }
};


internals.hasOwnEnumerableProperty = function (obj, key) {

    return Object.prototype.propertyIsEnumerable.call(obj, key);
};


internals.isSetSimpleEqual = function (obj, ref) {

    for (const entry of Set.prototype.values.call(obj)) {
        if (!Set.prototype.has.call(ref, entry)) {
            return false;
        }
    }

    return true;
};


internals.isDeepEqualObj = function (instanceType, obj, ref, options, seen) {

    const { isDeepEqual, valueOf, hasOwnEnumerableProperty } = internals;
    const { keys, getOwnPropertySymbols } = Object;

    if (instanceType === Types.array) {
        if (options.part) {

            // Check if any index match any other index

            for (const objValue of obj) {
                for (const refValue of ref) {
                    if (isDeepEqual(objValue, refValue, options, seen)) {
                        return true;
                    }
                }
            }
        }
        else {
            if (obj.length !== ref.length) {
                return false;
            }

            for (let i = 0; i < obj.length; ++i) {
                if (!isDeepEqual(obj[i], ref[i], options, seen)) {
                    return false;
                }
            }

            return true;
        }
    }
    else if (instanceType === Types.set) {
        if (obj.size !== ref.size) {
            return false;
        }

        if (!internals.isSetSimpleEqual(obj, ref)) {

            // Check for deep equality

            const ref2 = new Set(Set.prototype.values.call(ref));
            for (const objEntry of Set.prototype.values.call(obj)) {
                if (ref2.delete(objEntry)) {
                    continue;
                }

                let found = false;
                for (const refEntry of ref2) {
                    if (isDeepEqual(objEntry, refEntry, options, seen)) {
                        ref2.delete(refEntry);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    return false;
                }
            }
        }
    }
    else if (instanceType === Types.map) {
        if (obj.size !== ref.size) {
            return false;
        }

        for (const [key, value] of Map.prototype.entries.call(obj)) {
            if (value === undefined && !Map.prototype.has.call(ref, key)) {
                return false;
            }

            if (!isDeepEqual(value, Map.prototype.get.call(ref, key), options, seen)) {
                return false;
            }
        }
    }
    else if (instanceType === Types.error) {

        // Always check name and message

        if (obj.name !== ref.name ||
            obj.message !== ref.message) {

            return false;
        }
    }

    // Check .valueOf()

    const valueOfObj = valueOf(obj);
    const valueOfRef = valueOf(ref);
    if ((obj !== valueOfObj || ref !== valueOfRef) &&
        !isDeepEqual(valueOfObj, valueOfRef, options, seen)) {

        return false;
    }

    // Check properties

    const objKeys = keys(obj);
    if (!options.part &&
        objKeys.length !== keys(ref).length &&
        !options.skip) {

        return false;
    }

    let skipped = 0;
    for (const key of objKeys) {
        if (options.skip &&
            options.skip.includes(key)) {

            if (ref[key] === undefined) {
                ++skipped;
            }

            continue;
        }

        if (!hasOwnEnumerableProperty(ref, key)) {
            return false;
        }

        if (!isDeepEqual(obj[key], ref[key], options, seen)) {
            return false;
        }
    }

    if (!options.part &&
        objKeys.length - skipped !== keys(ref).length) {

        return false;
    }

    // Check symbols

    if (options.symbols !== false) {                                // Defaults to true
        const objSymbols = getOwnPropertySymbols(obj);
        const refSymbols = new Set(getOwnPropertySymbols(ref));

        for (const key of objSymbols) {
            if (!options.skip ||
                !options.skip.includes(key)) {

                if (hasOwnEnumerableProperty(obj, key)) {
                    if (!hasOwnEnumerableProperty(ref, key)) {
                        return false;
                    }

                    if (!isDeepEqual(obj[key], ref[key], options, seen)) {
                        return false;
                    }
                }
                else if (hasOwnEnumerableProperty(ref, key)) {
                    return false;
                }
            }

            refSymbols.delete(key);
        }

        for (const key of refSymbols) {
            if (hasOwnEnumerableProperty(ref, key)) {
                return false;
            }
        }
    }

    return true;
};


internals.SeenEntry = class {

    constructor(obj, ref) {

        this.obj = obj;
        this.ref = ref;
    }

    isSame(obj, ref) {

        return this.obj === obj && this.ref === ref;
    }
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./types":52,"buffer":5}],37:[function(require,module,exports){
'use strict';

const Stringify = require('./stringify');


const internals = {};


module.exports = class extends Error {

    constructor(args) {

        const msgs = args
            .filter((arg) => arg !== '')
            .map((arg) => {

                return typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : Stringify(arg);
            });

        super(msgs.join(' ') || 'Unknown error');

        if (typeof Error.captureStackTrace === 'function') {            // $lab:coverage:ignore$
            Error.captureStackTrace(this, exports.assert);
        }
    }
};

},{"./stringify":51}],38:[function(require,module,exports){
'use strict';

const Assert = require('./assert');


const internals = {};


module.exports = function (attribute) {

    // Allowed value characters: !#$%&'()*+,-./:;<=>?@[]^_`{|}~ and space, a-z, A-Z, 0-9, \, "

    Assert(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(attribute), 'Bad attribute value (' + attribute + ')');

    return attribute.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');                             // Escape quotes and slash
};

},{"./assert":31}],39:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (input) {

    if (!input) {
        return '';
    }

    let escaped = '';

    for (let i = 0; i < input.length; ++i) {

        const charCode = input.charCodeAt(i);

        if (internals.isSafe(charCode)) {
            escaped += input[i];
        }
        else {
            escaped += internals.escapeHtmlChar(charCode);
        }
    }

    return escaped;
};


internals.escapeHtmlChar = function (charCode) {

    const namedEscape = internals.namedHtml[charCode];
    if (typeof namedEscape !== 'undefined') {
        return namedEscape;
    }

    if (charCode >= 256) {
        return '&#' + charCode + ';';
    }

    const hexValue = charCode.toString(16).padStart(2, '0');
    return `&#x${hexValue};`;
};


internals.isSafe = function (charCode) {

    return (typeof internals.safeCharCodes[charCode] !== 'undefined');
};


internals.namedHtml = {
    '38': '&amp;',
    '60': '&lt;',
    '62': '&gt;',
    '34': '&quot;',
    '160': '&nbsp;',
    '162': '&cent;',
    '163': '&pound;',
    '164': '&curren;',
    '169': '&copy;',
    '174': '&reg;'
};


internals.safeCharCodes = (function () {

    const safe = {};

    for (let i = 32; i < 123; ++i) {

        if ((i >= 97) ||                    // a-z
            (i >= 65 && i <= 90) ||         // A-Z
            (i >= 48 && i <= 57) ||         // 0-9
            i === 32 ||                     // space
            i === 46 ||                     // .
            i === 44 ||                     // ,
            i === 45 ||                     // -
            i === 58 ||                     // :
            i === 95) {                     // _

            safe[i] = null;
        }
    }

    return safe;
}());

},{}],40:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (input) {

    if (!input) {
        return '';
    }

    const lessThan = 0x3C;
    const greaterThan = 0x3E;
    const andSymbol = 0x26;
    const lineSeperator = 0x2028;

    // replace method
    let charCode;
    return input.replace(/[<>&\u2028\u2029]/g, (match) => {

        charCode = match.charCodeAt(0);

        if (charCode === lessThan) {
            return '\\u003c';
        }

        if (charCode === greaterThan) {
            return '\\u003e';
        }

        if (charCode === andSymbol) {
            return '\\u0026';
        }

        if (charCode === lineSeperator) {
            return '\\u2028';
        }

        return '\\u2029';
    });
};

},{}],41:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (string) {

    // Escape ^$.*+-?=!:|\/()[]{},

    return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};

},{}],42:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = internals.flatten = function (array, target) {

    const result = target || [];

    for (let i = 0; i < array.length; ++i) {
        if (Array.isArray(array[i])) {
            internals.flatten(array[i], result);
        }
        else {
            result.push(array[i]);
        }
    }

    return result;
};

},{}],43:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function () { };

},{}],44:[function(require,module,exports){
'use strict';

exports.applyToDefaults = require('./applyToDefaults');

exports.assert = require('./assert');

exports.Bench = require('./bench');

exports.block = require('./block');

exports.clone = require('./clone');

exports.contain = require('./contain');

exports.deepEqual = require('./deepEqual');

exports.Error = require('./error');

exports.escapeHeaderAttribute = require('./escapeHeaderAttribute');

exports.escapeHtml = require('./escapeHtml');

exports.escapeJson = require('./escapeJson');

exports.escapeRegex = require('./escapeRegex');

exports.flatten = require('./flatten');

exports.ignore = require('./ignore');

exports.intersect = require('./intersect');

exports.isPromise = require('./isPromise');

exports.merge = require('./merge');

exports.once = require('./once');

exports.reach = require('./reach');

exports.reachTemplate = require('./reachTemplate');

exports.stringify = require('./stringify');

exports.wait = require('./wait');

},{"./applyToDefaults":30,"./assert":31,"./bench":32,"./block":33,"./clone":34,"./contain":35,"./deepEqual":36,"./error":37,"./escapeHeaderAttribute":38,"./escapeHtml":39,"./escapeJson":40,"./escapeRegex":41,"./flatten":42,"./ignore":43,"./intersect":45,"./isPromise":46,"./merge":47,"./once":48,"./reach":49,"./reachTemplate":50,"./stringify":51,"./wait":54}],45:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (array1, array2, options = {}) {

    if (!array1 ||
        !array2) {

        return (options.first ? null : []);
    }

    const common = [];
    const hash = (Array.isArray(array1) ? new Set(array1) : array1);
    const found = new Set();
    for (const value of array2) {
        if (internals.has(hash, value) &&
            !found.has(value)) {

            if (options.first) {
                return value;
            }

            common.push(value);
            found.add(value);
        }
    }

    return (options.first ? null : common);
};


internals.has = function (ref, key) {

    if (typeof ref.has === 'function') {
        return ref.has(key);
    }

    return ref[key] !== undefined;
};

},{}],46:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (promise) {

    return !!promise && typeof promise.then === 'function';
};

},{}],47:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const Assert = require('./assert');
const Clone = require('./clone');
const Utils = require('./utils');


const internals = {};


module.exports = internals.merge = function (target, source, options) {

    Assert(target && typeof target === 'object', 'Invalid target value: must be an object');
    Assert(source === null || source === undefined || typeof source === 'object', 'Invalid source value: must be null, undefined, or an object');

    if (!source) {
        return target;
    }

    options = Object.assign({ nullOverride: true, mergeArrays: true }, options);

    if (Array.isArray(source)) {
        Assert(Array.isArray(target), 'Cannot merge array onto an object');
        if (!options.mergeArrays) {
            target.length = 0;                                                          // Must not change target assignment
        }

        for (let i = 0; i < source.length; ++i) {
            target.push(Clone(source[i], { symbols: options.symbols }));
        }

        return target;
    }

    const keys = Utils.keys(source, options);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        if (key === '__proto__' ||
            !Object.prototype.propertyIsEnumerable.call(source, key)) {

            continue;
        }

        const value = source[key];
        if (value &&
            typeof value === 'object') {

            if (target[key] === value) {
                continue;                                           // Can occur for shallow merges
            }

            if (!target[key] ||
                typeof target[key] !== 'object' ||
                (Array.isArray(target[key]) !== Array.isArray(value)) ||
                value instanceof Date ||
                (Buffer && Buffer.isBuffer(value)) ||               // $lab:coverage:ignore$
                value instanceof RegExp) {

                target[key] = Clone(value, { symbols: options.symbols });
            }
            else {
                internals.merge(target[key], value, options);
            }
        }
        else {
            if (value !== null &&
                value !== undefined) {                              // Explicit to preserve empty strings

                target[key] = value;
            }
            else if (options.nullOverride) {
                target[key] = value;
            }
        }
    }

    return target;
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"./assert":31,"./clone":34,"./utils":53,"buffer":5}],48:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (method) {

    if (method._hoekOnce) {
        return method;
    }

    let once = false;
    const wrapped = function (...args) {

        if (!once) {
            once = true;
            method(...args);
        }
    };

    wrapped._hoekOnce = true;
    return wrapped;
};

},{}],49:[function(require,module,exports){
'use strict';

const Assert = require('./assert');


const internals = {};


module.exports = function (obj, chain, options) {

    if (chain === false ||
        chain === null ||
        chain === undefined) {

        return obj;
    }

    options = options || {};
    if (typeof options === 'string') {
        options = { separator: options };
    }

    const isChainArray = Array.isArray(chain);

    Assert(!isChainArray || !options.separator, 'Separator option no valid for array-based chain');

    const path = isChainArray ? chain : chain.split(options.separator || '.');
    let ref = obj;
    for (let i = 0; i < path.length; ++i) {
        let key = path[i];
        const type = options.iterables && internals.iterables(ref);

        if (Array.isArray(ref) ||
            type === 'set') {

            const number = Number(key);
            if (Number.isInteger(number)) {
                key = number < 0 ? ref.length + number : number;
            }
        }

        if (!ref ||
            typeof ref === 'function' && options.functions === false ||         // Defaults to true
            !type && ref[key] === undefined) {

            Assert(!options.strict || i + 1 === path.length, 'Missing segment', key, 'in reach path ', chain);
            Assert(typeof ref === 'object' || options.functions === true || typeof ref !== 'function', 'Invalid segment', key, 'in reach path ', chain);
            ref = options.default;
            break;
        }

        if (!type) {
            ref = ref[key];
        }
        else if (type === 'set') {
            ref = [...ref][key];
        }
        else {  // type === 'map'
            ref = ref.get(key);
        }
    }

    return ref;
};


internals.iterables = function (ref) {

    if (ref instanceof Set) {
        return 'set';
    }

    if (ref instanceof Map) {
        return 'map';
    }
};

},{"./assert":31}],50:[function(require,module,exports){
'use strict';

const Reach = require('./reach');


const internals = {};


module.exports = function (obj, template, options) {

    return template.replace(/{([^{}]+)}/g, ($0, chain) => {

        const value = Reach(obj, chain, options);
        return (value === undefined || value === null ? '' : value);
    });
};

},{"./reach":49}],51:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (...args) {

    try {
        return JSON.stringify.apply(null, args);
    }
    catch (err) {
        return '[Cannot display object: ' + err.message + ']';
    }
};

},{}],52:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

const internals = {};


exports = module.exports = {
    array: Array.prototype,
    buffer: Buffer && Buffer.prototype,             // $lab:coverage:ignore$
    date: Date.prototype,
    error: Error.prototype,
    generic: Object.prototype,
    map: Map.prototype,
    promise: Promise.prototype,
    regex: RegExp.prototype,
    set: Set.prototype,
    weakMap: WeakMap.prototype,
    weakSet: WeakSet.prototype
};


internals.typeMap = new Map([
    ['[object Error]', exports.error],
    ['[object Map]', exports.map],
    ['[object Promise]', exports.promise],
    ['[object Set]', exports.set],
    ['[object WeakMap]', exports.weakMap],
    ['[object WeakSet]', exports.weakSet]
]);


exports.getInternalProto = function (obj) {

    if (Array.isArray(obj)) {
        return exports.array;
    }

    if (Buffer && obj instanceof Buffer) {          // $lab:coverage:ignore$
        return exports.buffer;
    }

    if (obj instanceof Date) {
        return exports.date;
    }

    if (obj instanceof RegExp) {
        return exports.regex;
    }

    if (obj instanceof Error) {
        return exports.error;
    }

    const objName = Object.prototype.toString.call(obj);
    return internals.typeMap.get(objName) || exports.generic;
};

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":5}],53:[function(require,module,exports){
'use strict';

const internals = {};


exports.keys = function (obj, options = {}) {

    return options.symbols !== false ? Reflect.ownKeys(obj) : Object.getOwnPropertyNames(obj);  // Defaults to true
};

},{}],54:[function(require,module,exports){
'use strict';

const internals = {};


module.exports = function (timeout, returnValue) {

    if (typeof timeout !== 'number' && timeout !== undefined) {
        throw new TypeError('Timeout must be a number');
    }

    return new Promise((resolve) => setTimeout(resolve, timeout, returnValue));
};

},{}],55:[function(require,module,exports){
/* Copyright (c) 2020 Richard Rodger, MIT License */
'use strict'

var tests = []
var print =
  'undefined' === typeof document
    ? console.log
    : function (s, nl) {
        var out = document.querySelector('#test-results') // eslint-disable-line
        out.innerHTML = out.innerHTML + s + (false === nl ? ' ' : '<br>')
      }

var Lab = {
  script: function () {
    return {
      it: web_it,
      describe: web_describe,
    }
  },
}

function web_it(name, opts, fn) {
  tests.push({ name: name, opts: opts, fn: fn || opts })
}

function web_describe(name, testdef) {
  print(name)
  testdef()

  runtest(tests.shift())
}

function runtest(test) {
  if (null == test) return

  print(test.name, false)

  try {
    var res = test.fn(function () {})

    if (res) {
      res.then(function (err) {
        if (err) {
          print('fail ' + err)
        } else {
          print('pass')
        }
        runtest(tests.shift())
      })
    } else {
      print('pass')
      runtest(tests.shift())
    }
  } catch (err) {
    print('fail ' + err)
  }
}

module.exports = Lab

},{}],56:[function(require,module,exports){
(function (setImmediate){(function (){
/* Copyright (c) 2016-2021 Richard Rodger, MIT License */
'use strict'

const { Ordu } = require('..')

let Lab = require('@hapi/lab')
Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const describe = lab.describe
const it = lab.it
const expect = Code.expect

describe('ordu', function () {
  it('sanity', async () => {
    const h0 = new Ordu()
    expect(h0).exists()
  })

  it('happy', async () => {
    const h0 = new Ordu()

    h0.add((spec) => ({
      op: 'merge',
      out: {
        y: spec.data.x * 10,
      },
    }))

    let o0 = await h0.exec({}, { x: 11 })
    expect(o0.data).equals({ x: 11, y: 110 })

    let o1 = await h0.exec({}, { x: 22 })
    expect(o1.data).equals({ x: 22, y: 220 })

    h0.add((spec) => ({
      op: 'merge',
      out: {
        z: spec.data.y / 100,
      },
    }))

    let o2 = await h0.exec({}, { x: 33 })
    expect(o2.data).equals({ x: 33, y: 330, z: 3.3 })

    // let o3 = h0.execSync({},{x:33})
    // expect(o3.data).equals({x:33, y:330, z:3.3})
  })

  it('basic', async () => {
    const h0 = new Ordu()
    const taskresult_log = []
    const taskend_log = []

    h0.on('task-result', (tr) => {
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev) => {
      taskend_log.push(ev)
    })

    h0.add({
      name: 'A',
      from: 'my-ref-01',
      meta: {
        from: { foo: 1 },
      },
    })

    h0.add({
      name: 'B',
      active: false,
    })

    h0.add({
      exec: (spec) => {
        if (spec.ctx.err0) {
          throw new Error('err0')
        }
        if (spec.ctx.err2) {
          return { op: 'not-an-op' }
        }
        return null
      },
    })

    h0.add({
      id: '0',
      exec: () => ({
        op: 'merge',
        out: {
          x: 2,
        },
        why: 'some-reason',
      }),
    })

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
    })

    h0.add({
      name: 'a',
      exec: async () => {
        return new Promise((r) =>
          setTimeout(() => {
            r({
              op: 'merge',
              // out missing!
            })
          }, 10)
        )
      },
    })

    h0.add(function b() {
      return {
        op: 'merge',
        out: {
          x: 4,
        },
      }
    })

    h0.add(function c() {
      return {
        op: 'lookup',
        out: {
          id: '001',
        },
      }
    })

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
    })

    h0.add({
      exec: () => ({
        op: 'merge',
        out: {
          'should-never-be-reached': true,
        },
      }),
    })

    h0.add(() => {})

    let ts = 1
    let tI = ts

    expect(
      Object.keys(h0.task).map(
        (tn) => tn + '~' + ('function' === typeof h0.task[tn].exec)
      )
    ).equal([
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
    ])

    h0.operator('lookup', async (tr, ctx, data) => {
      if (ctx.err1) throw new Error('err1')

      return new Promise((r) => {
        setTimeout(() => {
          data.y = tr.out
          r({ stop: false })
        }, 10)
      })
    })

    h0.operator(function does_nothing(tr, ctx, data) {
      return { stop: false }
    })

    expect(h0.tasks().length).equal(12)

    let out = await h0.exec()
    expect(out.data).equal({ x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(12)

    tI = ts
    expect(taskresult_log.map((te) => te.name + '~' + te.op)).equal([
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
    ])

    tI = ts
    expect(
      taskend_log.map((te) => te.name + '~' + te.op + '~' + te.operate.stop)
    ).equal([
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
    ])

    out = await h0.exec({}, { z: 1, y: null })
    expect(out.data).equal({ z: 1, x: 4, y: { id: '001' }, qq: 2, last: 99 })
    expect(out.task_count).equal(8)
    expect(out.task_total).equal(12)

    out = await h0.exec({ err0: true }, { z: 2 })
    //console.log(out)
    expect(out.err.message).equal('err0')

    let operators = h0.operators()
    expect(Object.keys(operators)).equal([
      'next',
      'skip',
      'stop',
      'merge',
      'lookup',
      'does_nothing',
    ])

    tI = ts
    expect(h0.tasks().map((t) => t.name)).equals([
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
    ])

    out = await h0.exec({ err1: true }, null, { runid: 'foo' })
    //console.log(out)
    expect(out.err.message).equal('err1')

    out = await h0.exec({ err2: true }, void 0, {
      done: (res) => {
        expect(res.err.message).equal('Unknown operation: not-an-op')
      },
    })
    expect(out.err.message).equal('Unknown operation: not-an-op')
  })

  it('async', async () => {
    const h0 = new Ordu({ debug: true })
    const taskresult_log = []
    const taskend_log = []

    h0.on('task-result', (tr) => {
      taskresult_log.push(tr)
    })

    h0.on('task-end', (ev) => {
      taskend_log.push(ev)
    })

    function foo() {
      return { op: 'merge', out: { foo: 1 } }
    }

    function bar() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { bar: 1 } }), 10)
      )
    }

    // async function zed() {
    function zed() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { zed: 1 } }), 10)
      )
    }

    async function qaz_impl() {
      return new Promise((r) =>
        setTimeout(() => r({ op: 'merge', out: { qaz: 1 } }), 10)
      )
    }

    async function qaz() {
      return await qaz_impl()
    }

    async function ext0(x) {
      return new Promise((r) => setTimeout(() => r('ext0-' + x), 10))
    }

    function a_ext0() {
      const ext0p = ext0('a')
      return { op: 'merge', out: { ext0p: ext0p } }
    }

    async function b_ext0(spec) {
      const ext0r = await spec.data.ext0p
      return { op: 'merge', out: { ext0r: ext0r } }
    }

    function ext1(x, cb) {
      setTimeout(() => cb(null, 'ext1-' + x), 10)
    }

    function a_ext1() {
      return new Promise((r) => {
        ext1('a', function (err, out) {
          r({ op: 'merge', out: { ext1r: out } })
        })
      })
    }

    h0.add({ name: 'foo', exec: foo })
    h0.add([bar, zed, { name: 'qaz', exec: qaz }])
    h0.add(a_ext0)
    h0.add(b_ext0)
    h0.add(a_ext1)

    let out = await h0.exec()
    //console.dir(out,{depth:null})
    expect(out.err).not.exists()

    expect(out.data).includes({
      foo: 1,
      bar: 1,
      zed: 1,
      qaz: 1,
      ext0r: 'ext0-a',
      ext1r: 'ext1-a',
    })

    expect(out.data.ext0p).exists()

    //console.dir(taskresult_log, {depth:null})
    //console.dir(taskend_log, {depth:null})
  })

  it('insert-order', async () => {
    const h0 = new Ordu()
    const names = (h0) =>
      h0
        .tasks()
        .map((t) => t.name)
        .join(' ')

    h0.add(function a() {})
    expect(names(h0)).equal('a')

    h0.add(function b() {})
    expect(names(h0)).equal('a b')

    h0.add(function c() {})
    expect(names(h0)).equal('a b c')

    h0.add(function A() {}, { before: 'a' })
    expect(names(h0)).equal('A a b c')

    h0.add(function B() {}, { before: 'b' })
    expect(names(h0)).equal('A a B b c')

    h0.add(function C() {}, { before: 'c' })
    expect(names(h0)).equal('A a B b C c')

    h0.add(function a0() {}, { after: 'a' })
    expect(names(h0)).equal('A a a0 B b C c')

    h0.add(function b0() {}, { after: 'b' })
    expect(names(h0)).equal('A a a0 B b b0 C c')

    h0.add(function c0() {}, { after: 'c' })
    expect(names(h0)).equal('A a a0 B b b0 C c c0')

    h0.add(function A0() {}, { before: 'a' })
    expect(names(h0)).equal('A A0 a a0 B b b0 C c c0')

    h0.add(function B0() {}, { before: 'b' })
    expect(names(h0)).equal('A A0 a a0 B B0 b b0 C c c0')

    h0.add(function C0() {}, { before: 'c' })
    expect(names(h0)).equal('A A0 a a0 B B0 b b0 C C0 c c0')

    h0.add(function a1() {}, { after: 'a' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b0 C C0 c c0')

    h0.add(function b1() {}, { after: 'b' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b1 b0 C C0 c c0')

    h0.add(function c1() {}, { after: 'c' })
    expect(names(h0)).equal('A A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function A1() {}, { after: 'A' })
    expect(names(h0)).equal('A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    h0.add(function AA0() {}, { before: 'A' })
    expect(names(h0)).equal('AA0 A A1 A0 a a1 a0 B B0 b b1 b0 C C0 c c1 c0')

    //console.log(names(h0))
  })

  it('errors', async () => {
    const h0 = new Ordu()

    h0.add(function a() {
      return {
        err: new Error('a-err'),
      }
    })

    let out = await h0.exec()
    expect(out.err.message).equals('a-err')

    let cbout
    await h0.exec(
      {},
      {},
      {
        done: function (rout) {
          cbout = rout
        },
      }
    )

    await new Promise((r) =>
      setImmediate(() => {
        expect(cbout.err.message).equals('a-err')
        r()
      })
    )

    const h1 = new Ordu()

    h1.add(function a() {
      throw new Error('a-terr')
    })

    let h1out = await h1.exec()
    expect(h1out.err.message).equals('a-terr')

    let h1cbout
    await h1.exec(
      {},
      {},
      {
        done: function (rout) {
          h1cbout = rout
        },
      }
    )

    await new Promise((r) =>
      setImmediate(() => {
        expect(h1cbout.err.message).equals('a-terr')
        r()
      })
    )
  })
})

}).call(this)}).call(this,require("timers").setImmediate)
},{"..":28,"@hapi/code":29,"@hapi/lab":1,"hapi-lab-shim":55,"timers":23}]},{},[56])(56)
});
