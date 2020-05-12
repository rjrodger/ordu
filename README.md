# ordu

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/11434/branches/170370/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=11434&bid=170370)
[![Maintainability](https://api.codeclimate.com/v1/badges/47fe47f0b317507cb120/maintainability)](https://codeclimate.com/github/rjrodger/ordu/maintainability)


### Execute functions in a configurable order, modifying a shared data structure.

Task functions are executed in order of addition, and passed a shared
context, and a modifiable data structure. Execution is
synchronous. You can exit early by returning a non-null value from a
task function.

You can tag task functions, and restrict execution to the subset of
task functions with matching tags.

This module is used by the [Seneca](http://senecajs.org) framework to
provide configurable extension hooks.


### Quick example

```js
var Ordu = require('ordu')

var w = Ordu()

w.add(function first (ctxt, data) {
  if (null == data.foo) {
    return {kind: 'error', why: 'no foo'}
  }

  data.foo = data.foo.substring(0, ctxt.len)
})

w.add({tags: ['upper']}, function second (ctxt, data) {
  data.foo = data.foo.toUpperCase()
})

var ctxt = {len: 3}
var data = {foo: 'green'}

w.process(ctxt, data)
console.log(data.foo) // prints 'GRE' (first, second)

data = {foo: 'blue'}
w.process({tags: ['upper']}, ctxt, data)
console.log(data.foo) // prints 'BLUE' (second)

data = []
var res = w.process(ctxt, data)
console.log(res) // prints {kind: 'error', why: 'no foo', ... introspection ...}
```



## Install

```sh
npm install ordu
```

# Notes

From the Irish ord&uacute;: [instruction](http://www.focloir.ie/en/dictionary/ei/instruction). Pronounced _or-doo_.


## License

Copyright (c) 2014-2016, Seamus D'Arcy and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[travis-badge]: https://travis-ci.org/rjrodger/ordu.svg
[travis-url]: https://travis-ci.org/rjrodger/ordu
[npm-badge]: https://img.shields.io/npm/v/ordu.svg
[npm-url]: https://npmjs.com/package/ordu
[david-badge]: https://david-dm.org/rjrodger/ordu.svg
[david-url]: https://david-dm.org/rjrodger/ordu
[coveralls-badge]: https://coveralls.io/repos/github/rjrodger/ordu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/rjrodger/ordu?branch=master
