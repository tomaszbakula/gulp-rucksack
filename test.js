'use strict';

var test = require('tape'),
    rucksack = require('./'),
    gutil = require('gulp-util'),
    Stream = require('stream'),
    path = require('path'),
    sourcemaps = require('gulp-sourcemaps');

var css = 'a{ absolute: 0; }',
    expected = 'a{ position: absolute; top: 0; right: 0; bottom: 0; left: 0; }',
    sourceMapRegex = /sourceMappingURL=data:application\/json;base64/;

function fixture (contents) {
  return new gutil.File({
    contents: contents,
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, '/fixture.css')
  });
}

test('Process CSS with Rucksack', function(t) {
    t.plan(1);

    var stream = rucksack({
      normalize: false
    });

    stream.on('data', function (data) {
        t.equal(String(data.contents), expected);
    });

    var file = fixture(new Buffer(css));

    stream.write(file);
});

test('Process CSS with sourcemaps', function (t) {
    t.plan(2);

    var init = sourcemaps.init();
    var write = sourcemaps.write();

    init.pipe(rucksack({
      normalize: false
    }))
    .pipe(write);

    write.on('data', function (data) {
        var contents = String(data.contents);
        var mappings = data.sourceMap.mappings;
        t.equal(mappings, 'AAAA,GAAG,mBAAY,CAAZ,OAAY,CAAZ,SAAY,CAAZ,UAAY,CAAZ,QAAY,EAAE', 'should generate the mappings');
        t.ok(sourceMapRegex.test(contents), 'should have the map applied');
    });

    var file = fixture(new Buffer(css));

    init.write(file);
    init.end();
});

test('Throw an error in stream mode', function (t) {
    t.plan(1);

    var stream = rucksack();

    var file = fixture(new Stream());

    var write = function () {
        stream.write(file);
        file.contents.write(css);
        file.contents.end();
    };

    t.throws(write, 'should not support streaming contents');
});

test('Let null files pass through', function (t) {
    t.plan(1);

    var stream = rucksack();

    stream.on('data', function (data) {
        t.equal(data.contents, null, 'should not transform null in any way');
    });

    var file = fixture(null);

    stream.write(file);
});
