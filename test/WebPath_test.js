var assert = require('assert');
var _ = require("lodash");

var WebPath = require("../wdf/WebPath");

describe( 'WebPath',function() {
  it('.Search', function () {
    var Search = WebPath.Search;
    var  s1 = new Search("Rhel+o");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(s1.matcher.test('allo hello ale'));
    assert.ok(s1.matcher.test('helo'));
    assert.ok(!s1.matcher.test('heLlo'));
    s1 = new Search("rhel+o");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(s1.matcher.test('allo hello ale'));
    assert.ok(s1.matcher.test('helo'));
    assert.ok(s1.matcher.test('heLlo'));
    s1 = new Search("R^hel+o$");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(!s1.matcher.test('allo hello ale'));
    assert.ok(s1.matcher.test('helo'));
    assert.ok(!s1.matcher.test('heLlo'));
    s1 = new Search("r^hel+o$");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(!s1.matcher.test('allo hello ale'));
    assert.ok(s1.matcher.test('helo'));
    assert.ok(s1.matcher.test('heLlo'));
    s1 = new Search("Shello");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(s1.matcher.test('allo hello ale'));
    assert.ok(!s1.matcher.test('helo'));
    assert.ok(!s1.matcher.test('heLlo'));
    s1 = new Search("shello");
    assert.ok(s1.matcher.test('hello'));
    assert.ok(s1.matcher.test('allo hello ale'));
    assert.ok(!s1.matcher.test('helo'));
    assert.ok(s1.matcher.test('heLlo'));
  });
  it('.Field', function () {
  });
  it('.Params', function () {
  });
  it('.path()/.isRoot()', function () {
  });
  it('.extension()', function () {
  });
  it('.enumerate()', function () {
  });
  it('all together', function () {
  });
});