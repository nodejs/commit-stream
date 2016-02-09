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
    t.error(err, 'no error')

    t.ok(list && list.length > 1, 'got a list')

    t.deepEqual(list[list.length - 9], {
        author      : { email: 'ralphtheninja@riseup.net', name: 'Lars-Magnus Skog' }
      , description : [
            'Fixes: https://github.com/rvagg/changelog-maker/issues/35'
        ]
      , ghIssue     : 1
      , ghProject   : 'commit-stream'
      , ghUser      : 'rvagg'
      , prUrl       : 'https://github.com/rvagg/commit-stream/pull/1'
      , sha         : '1bcfd072fd74399808fbcd5cf31ce5342dd6d70c'
      , summary     : 'process: this should not match PR-URL'
      , reviewers   : [ { email: 'rod@vagg.org', name: 'Rod Vagg' } ]
    }, 'got correct ninth commit')

    t.deepEqual(list[list.length - 4], {
        author: { email: 'rod@vagg.org', name: 'Rod Vagg' }
      , sha: 'f92b93c3c7175b07f847dd45058b121cea6b3a20'
      , summary: 'deleted package.json line'
    }, 'got correct fourth commit')

    t.deepEqual(list[list.length - 3], {
        author: { email: 'rod@vagg.org', name: 'Rod Vagg' }
      , description: [ 'comment', 'Reviewed-By: Nobody' ]
      , sha: 'db34ce2af09a6a9fb70241d43965a2bc48b90b4c'
      , summary: 'squished package.json'
    }, 'got correct third commit')

    t.deepEqual(list[list.length - 2], {
        author      : { email: 'rod@vagg.org', name: 'Rod Vagg' }
      , description : [
            'Some extra summary information here'
          , 'newline'
          , 'Fixes: https://github.com/rvagg/commit-stream/issues/0'
        ]
      , ghIssue     : 0
      , ghProject   : 'commit-stream'
      , ghUser      : 'rvagg'
      , prUrl       : 'https://github.com/rvagg/commit-stream/pulls/0'
      , reviewers   : [ { email: 'roger@vagg.org', name: 'Roger Vagg' } ]
      , sha         : '6275758f597ae579202fbe4eccca1407f2c67ac1'
      , summary     : 'added test.js'
    }, 'got correct second commit')

    t.deepEqual(list[list.length - 1], {
        sha    : 'd94841274e2979e7758413a0f48fa37560d0dde6'
      , author : { name: 'Rod Vagg', email: 'rod@vagg.org' }
      , summary: 'make it so'
    }, 'got correct first commit')

    t.end()
  })
})


test('current commit log with changes', function (t) {
  gitToList('git log --stat', function (err, list) {
    t.error(err, 'no errors')

    t.ok(list && list.length > 0, 'got a list')

    t.deepEqual(list[list.length - 4].changes, {
        files      : 1
      , insertions : 0
      , deletions  : 1
    }, 'got correct second commit changes')

    t.deepEqual(list[list.length - 3].changes, {
        files      : 1
      , insertions : 1
      , deletions  : 28
    }, 'got correct second commit changes')

    t.deepEqual(list[list.length - 2].changes, {
        files      : 1
      , insertions : 49
      , deletions  : 0
    }, 'got correct second commit changes')

    t.deepEqual(list[list.length - 1].changes, {
        files      : 1
      , insertions : 28
      , deletions  : 0
    }, 'got correct first commit changes')

    t.end()
  })
})
