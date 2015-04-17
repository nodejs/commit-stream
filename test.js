const through2     = require('through2')
    , commitStream = require('./')
    , spawn        = require('child_process').spawn
    , test         = require('tape')
    , split2       = require('split2')
    , listStream   = require('list-stream')


function gitToList (gitCmd, callback) {
  var child = spawn('bash', [ '-c', gitCmd ])
  child.stdout.pipe(split2()).pipe(commitStream()).pipe(listStream.obj(callback))
}


test('current plain commit log', function (t) {
  gitToList('git log', function (err, list) {
    t.error(err)

    t.ok(list && list.length > 1, 'got a list')
    t.deepEqual(list[0], {
        sha    : 'd94841274e2979e7758413a0f48fa37560d0dde6'
      , author : { name: 'Rod Vagg', email: 'rod@vagg.org' }
      , summary: 'make it so'
    }, 'got correct first commit')
    t.deepEqual(list[1], {
        sha    : 'd94841274e2979e7758413a0f48fa37560d0dde6'
      , author : { name: 'Rod Vagg', email: 'rod@vagg.org' }
      , summary: 'added test.js'
    }, 'got correct second commit')
    t.end()
  })
})


/*
test('current plain commit log', function (t) {
  gitToList('git log', function (err, list) {
    t.error(err)

    t.ok(list && list.length > 0, 'got a list')
    t.deepEqual(list[0], {
        sha    : 'd94841274e2979e7758413a0f48fa37560d0dde6'
      , author : { name: 'Rod Vagg', email: 'rod@vagg.org' }
      , summary: 'make it so'
    }, 'got correct first commit')
    t.end()
  }))
})
*/
