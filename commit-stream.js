const through2  = require('through2')
    , stripAnsi = require('strip-ansi')


module.exports = commitStream


function commitStream (ghUser, ghProject) {
  var commit

  return through2.obj(onLine, onEnd)

  function addLine (line) {
    line = stripAnsi(line)

    if (!line)
      return

    var old, m

    if (/^commit \w+$/.test(line)) {
      old = commit
      commit = {
        sha: line.split(' ')[1]
      }
    } else if (m = line.match(/^Author: ([^<]+) <([^>]+)>$/)) {
      if (!commit)
        throw new Error('wut?')
      commit.author = { name: m[1], email: m[2] }
    } else if (m = line.match(/^\s+Reviewed[- ]?By:?\s*([^<]+) <([^>]+)>\s*$/i)) {
      if (!commit.reviewers)
        commit.reviewers = []
      commit.reviewers.push({ name: m[1], email: m[2] })
    } else if (m = line.match(/^\s+PR(?:[- ]?URL)?:?\s*(.+)\s*$/)) {
      commit.prUrl = m[1]
      if (ghUser && ghProject && (m = commit.prUrl.match(/^\s*#?(\d+)\s*$/))) {
        commit.prUrl = 'https://github.com/' + ghUser + '/' + ghProject + '/pull/' + m[1]
      }
      if (m = commit.prUrl.match(/^(https?:\/\/.+\/([^\/]+)\/([^\/]+))\/\w+\/(\d+)$/i)) {
        commit.ghIssue   = +m[4]
        commit.ghUser    = m[2]
        commit.ghProject = m[3]
      }
    } else if (/^    /.test(line) && (line = line.trim()).length) {
      if (!commit.summary) {
        commit.summary = line
      } else {
        if (!commit.description)
          commit.description = []
        commit.description.push(line)
      }
    } else if (/^ [^ ]/.test(line) && (line = line.trim()).length) {
      if (m = line.match(/^(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/)) {
        commit.changes = {
            files      : Number(m[1])
          , insertions : Number(m[2] || 0)
          , deletions  : Number(m[3] || 0)
        }
      }
    }

    return old
  }

  function onLine (line, _, callback) {
    var commit = addLine(line)
    if (commit)
      this.push(commit)
    callback()
  }

  function onEnd (callback) {
    if (commit)
      this.push(commit)
    callback()
  }
}
