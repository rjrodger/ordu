# ordu

[![npm version][npm-badge]][npm-url]
[![Build](https://github.com/senecajs/seneca-mem-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-mem-store/actions/workflows/build.yml)
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/11434/branches/170370/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=11434&bid=170370)
[![Maintainability](https://api.codeclimate.com/v1/badges/47fe47f0b317507cb120/maintainability)](https://codeclimate.com/github/rjrodger/ordu/maintainability)


### Execute functions in a configurable order, modifying a shared data structure.

Task functions are executed in order of addition, and passed a shared
context, a modifiable data structure, and task meta data. Execution is
synchronous or asynchronous. You can control execution by returning
commands from a task function.

You can add tasks before and after existing named tasks.

This module is used by the [Seneca](http://senecajs.org) framework to
provide configurable extension hooks to various internal processes.


### Quick example

NOTE: OUT-OF-DATE

SEE TESTS FOR API CHANGES

TODO: UPDATE README


```js
const Ordu = require('ordu')

let process = new Ordu()

process.add(function first(spec) {
  if (null == spec.data.foo) {
    return {op: 'stop', err: new Error('no foo')}
  }

  spec.data.foo = spec.data.foo.toUpperCase() + spec.ctx.suffix

  // Default is to continue to next step.
})


const ctx = { suffix: '!!!' }
let data = { foo: 'green' }

process.execSync(ctx, data)
console.log(data.foo) // prints 'GREEN!!!' (first)


process.add(function second(spec) {
  spec.data.foo = spec.ctx.prefix + spec.data.foo
})

ctx.prefix = '>>>'
data = { foo: 'blue' }

process.execSync(ctx, data)
console.log(data.foo) // prints '>>>BLUE!!!' (first, second)
```



## Install

```sh
npm install ordu
```


# Notes

From the Irish ord&uacute;: [instruction](http://www.focloir.ie/en/dictionary/ei/instruction). Pronounced _or-doo_.


## License

Copyright (c) 2014-2021, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[npm-badge]: https://img.shields.io/npm/v/ordu.svg
[npm-url]: https://npmjs.com/package/ordu
[david-badge]: https://david-dm.org/rjrodger/ordu.svg
[david-url]: https://david-dm.org/rjrodger/ordu
[coveralls-badge]: https://coveralls.io/repos/github/rjrodger/ordu/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/rjrodger/ordu?branch=master
