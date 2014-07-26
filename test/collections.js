(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      '../collections',
      '../node_modules/chai/chai.js'
    ], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(
      require('../collections'),
      require('chai')
    );
  } else {
    throw new Error('not supporting globals in tests');
  }
})(this, function(col, chai, mocha) {
  'use strict';

  var eMap = col.Map, eSet = col.Set;
  var assert = chai.assert;

  suite('Collections', function() {

    suite('Test collection constructors', function() {

      test('Create a Set from an Array', function() {
        var s = new eSet([1, 2, 3]);
        assert.equal(s.size, 3);
        var count = 0;
        var hitOne = false, hitTwo = false, hitThree = false;
        s.forEach(function(key) {
          if (key === 1) hitOne = true;
          if (key === 2) hitTwo = true;
          if (key === 3) hitThree = true;
        });
        assert.ok(hitOne && hitTwo && hitThree, 'array elements not added');
      });

      test('Create a Set from a Set', function() {
        var s = new eSet();
        s.add('A');
        s.add('B');
        var t = new eSet(s);
        assert.equal(t.size, 2);
        assert.ok(t.has('A'), 'has no A');
        assert.ok(t.has('B'), 'has no B');
      });

      test('Create a Set from a Map', function() {
        var m = new eMap();
        m.set(1, 'A');
        m.set(2, 'B');
        m.set(3, 'C');
        var s = new eSet(m);
        var c = 0;
        s.forEach(function(v, k) {
          c++;
          if (k[0] === 1)
            assert.deepEqual(v, [1, 'A']);
          else if (k[0] === 2)
            assert.deepEqual(v, [2, 'B']);
          else if (k[0] === 3)
            assert.deepEqual(v, [3, 'C']);
          else
            assert.ok(false, 'unexpected k/v '+k+' and '+v);
        });
        assert.equal(c, 3);
      });


      test('Create a Map from an Array', function() {
        var m = new eMap([[1, 2], [3, 4], [5, 6]]);
        assert.equal(m.size, 3);
        var count = 0;
        var hitOne = false, hitTwo = false, hitThree = false;
        assert.ok(m.get(1) === 2, 'has no 1 -> 2');
        assert.ok(m.get(3) === 4, 'has no 3 -> 4');
        assert.ok(m.get(5) === 6, 'has no 5 -> 6');
      });

      test('Create a Map from a short Array ', function() {
        var m, c = 0;
        m = new eMap([[1], [3], [5]]);
        m.forEach(function(v, k) {
          c++;
          if ([1, 3, 5].indexOf(k) !== -1)
            assert.equal(v, undefined);
          else
            assert.ok(false, 'unexpected k/v '+k+' and '+v);
        });
        assert.equal(c, 3);
      });

      test('Create a Map from a malformed Array (fails)', function() {
        var m, c = 0;
        m = new eMap([[1], [3, 5, 7], [5]]);
        m.forEach(function(v, k) {
          c++;
          if ([1, 5].indexOf(k) !== -1)
            assert.equal(v, undefined);
          else if (k === 3)
            assert.equal(v, 5);
          else
            assert.ok(false, 'unexpected k/v '+k+' and '+v);
        });
        assert.equal(c, 3);
      });

      test('Create a Map from a Set', function() {
        var s = new eSet(), c = 0;
        s.add(['A', 'B']);
        s.add(['C', 'D']);
        var m = new eMap(s);
        assert.equal(m.size, 2);
        m.forEach(function(v, k) {
          c++
          if (k === 'A')
            assert.equal(v, 'B');
          else if (k === 'C')
            assert.equal(v, 'D');
          else
            assert.ok(false, 'unexpected k/v '+k+' and '+v);
        });
        assert.equal(c, 2);
      });

      test('Create a Map from a malformed Set (fails)', function() {
        var s = new eSet(), erred = false, m;
        s.add('A');
        s.add('B');
        try {
          m = new eMap(s);
        } catch(err) {
          erred = err;
        }
        assert.ok(erred);
      });

      test('Create a Map from a Map', function() {
        var m1 = new eMap([[1, 2], [3, 4], [5, 6]]);
        var m2 = new eMap(m1);
        assert.equal(m2.size, 3);
        var count = 0;
        var hitOne = false, hitTwo = false, hitThree = false;
        assert.ok(m2.get(1) === 2, 'has no 1 -> 2');
        assert.ok(m2.get(3) === 4, 'has no 3 -> 4');
        assert.ok(m2.get(5) === 6, 'has no 5 -> 6');
      });
    });

    suite('Enumeration', function() {
      test('Enumerate a Map', function() {
        var m = new eMap();
        m.set(1, 'A');
        m.set(2, 'B');
        m.set(3, 'C');
        var sawA = false, sawB = false, sawC = false;
        m.forEach(function(value, key) {
          switch(key) {
            case 1:
              assert.deepEqual(value, 'A');
              sawA = true;
              break;
            case 2:
              assert.deepEqual(value, 'B');
              sawB = true;
              break;
            case 3:
              assert.deepEqual(value, 'C');
              sawC = true;
              break;
          }
        });
        assert.ok(sawA, 'saw A');
        assert.ok(sawB, 'saw B');
        assert.ok(sawC, 'saw C');
      });

      test('Enumerate a Set', function() {
        var m = new eSet();
        m.add('A');
        m.add('B');
        m.add('C');
        var sawA = false, sawB = false, sawC = false;
        m.forEach(function(value) {
          switch(value) {
            case 'A':
              sawA = true;
              break;
            case 'B':
              sawB = true;
              break;
            case 'C':
              sawC = true;
              break;
          }
        });
        assert.ok(sawA, 'saw A');
        assert.ok(sawB, 'saw B');
        assert.ok(sawC, 'saw C');
      });
    });

    suite('Deletion', function() {
      test('Delete an element from a Map size=1', function() {
        var m = new eMap();
        m.set('A', 1);
        m.delete('A');
        assert.equal(m.size, 0);
        var count = 0;
        m.forEach(function(x, key) {
          count++;
        });
        assert.equal(count, 0);
      });

      test('Delete an element from a Map size=2', function() {
        var m = new eMap();
        m.set('A', 1);
        m.set('B', 2);
        m.delete('A');
        assert.equal(m.size, 1, 'size is not 1');
        var count = 0;
        m.forEach(function(x, key) {
          assert.equal(key, 'B', 'wrong key');
          assert.equal(x, 2, 'wrong value');
          count++;
        });
        assert.equal(count, 1, 'wrong count');
      });

      test('Delete 97 elements from a Map size=100', function() {
        var m = new eMap();
        for (var i = 0; i < 100; i++) {
          m.set('A' + i, i);
        }
        for (var i = 0; i < 97; i++) {
          m.delete('A' + i);
        }
        assert.equal(m.size, 3, 'size is not 3');
        var count = 0;
        m.forEach(function(x, key) {
          assert.ok(x < 100 && x >=97, 'wrong value');
          count++;
        });
        assert.equal(m.size, count, 'wrong number of iterations');
      });
    });
  });
});
