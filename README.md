# Harmony-Enumerables for Node.js

[![Build Status](https://secure.travis-ci.org/oconnore/harmony-enumerables.png?branch=master)](http://travis-ci.org/oconnore/harmony-enumerables)

## What is this?

Harmony Enumerables allows you to enumerate the elements of a Map or Set when using Node.js with the ``--harmony``` flag. That's it.

For example:

```javascript
var eSet = require('harmony-enumerables').Set;

var s = new eSet();
s.add({value: 2});
s.add({value: 3});
s.add({value: 4});

var x = 0;
s.forEach(function(value) {
  x += value;
})

assert.equal(x, 9); // true
```

In addition to forEach, it also adds an iterator interface:

```javascript
var eMap = require('harmony-enumerables').Map;
var m = new eMap();
m.set(18, {value: 2});
m.set(34, {value: 3});
m.set(76, {value: 4});

var x = 0;
var iter = m.iterator();
while (!iter.done) {
  var value = iter.next();
  x += value;
}

assert.equal(x, 9); // true
```
