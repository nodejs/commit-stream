# commit-stream

**Turn a `git log` into a stream of commit objects**

[![npm](https://nodei.co/npm/commit-stream.png?downloads=true&downloadRank=true)](https://nodei.co/npm/commit-stream/)
[![npm](https://nodei.co/npm-dl/commit-stream.png?months=6&height=3)](https://nodei.co/npm/commit-stream/)

## API

**`commitStream([defaultGithubUser, defaultGithubProject])`**

Returns an object stream that you can pipe a stream of newlines from the output of `git log` to. The output of the stream is a series of objects, each representing a commit from the log.`

Intended to be used on a standard log format (not a simplified one using one of the simplifying `--format` options) but it will also process change stats if you `git log --stat`.

Typical usage:

```js
var spawn      = require('child_process').spawn
  , split2     = require('split2')
  , listStream = require('list-stream')

spawn('bash', [ '-c', 'git log' ])
  .stdout.pipe(split2()) // break up by newline characters
  .pipe(commitStream('rvagg', 'commit-stream'))
  .pipe(listStream.obj(onCommitList))


function onCommitList (err, list) {
  // list is an array of objects
}
```

Commit object properties:

* `sha`: the full commit sha
* `author`: an object representing the author of the commit
  - `name`: the name of the committer
  - `email`: the email of the committer
* `summary`: the one-line summary of the commit
* `description`: the free-form text content of the summary, minus specific metadata lines
* `reviewers`: an array containing objects with `name` and `email` properties if the commit metadata contains reviewers in a `Reviewed-By: Foo Bar <baz@boom>` format.
* `changes`: if `--stat` data is included in the git log, an object containing change stats:
  - `files`: the number of files changed
  - `insertions`: the number of new lines inserted
  - `deletions`: the number of old lines removed
* `prUrl`: a URL pointing to a pull-request where this change was made if the commit metadata contains a `PR-URL: https://github.com/user/project/pull/XX` line. Note that whatever proceeds the `PR-URL: ` string will be collected in this property; one exception being that if a shortened `#XX` version is found and you have supplied `defaultGitHubUser` and `defaultGitHubProject` arguments to the constructor then a full GitHub pull-request will be reconstituted in its place.
* `ghUser`, `ghProject, `ghIssue`: if a proper GitHub pull request is found for the `prUrl` property (including shortened `#XX` ones), these properties will be added to point to the original user, project and issue (pull-request) for this change, as extracted from the URL.

## License

**commit-stream** is Copyright (c) 2015 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE.md file for more details.
