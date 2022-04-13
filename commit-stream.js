import through2 from 'through2'
import stripAnsi from 'strip-ansi'

export default function commitStream (ghUser, ghProject) {
  let commit

  return through2.obj(onLine, onEnd)

  function addLine (line) {
    line = stripAnsi(line)

    if (line.length === 0) return

    let old, m

    if (/^commit \w+$/.test(line)) {
      old = commit
      commit = { sha: line.split(' ')[1] }
    } else if ((m = line.match(/^CommitDate:\s+(.*)$/)) !== null) {
      if (commit === undefined || commit === null) {
        throw new Error('Something unexpected occurred')
      }
      commit.commitDate = m[1].trim()
    } else if (
      (m = line.match(
        /^\s*(?:Author|Co[- ]?authored[- ]?by):?\s*([^<]+) <([^>]+)>\s*$/i
      )) !== null
    ) {
      if (commit === undefined || commit === null) {
        throw new Error('Something unexpected occurred')
      }
      if (commit.authors === undefined || commit.authors === null) {
        commit.authors = []
      }
      commit.authors.push({ name: m[1], email: m[2] })
    } else if ((m = line.match(/^(?:AuthorDate|Date):\s+(.*)$/)) !== null) {
      if (commit === undefined || commit === null) {
        throw new Error('Something unexpected occurred')
      }
      commit.authorDate = m[1].trim()
    } else if (
      (m = line.match(/^\s+Reviewed[- ]?By:?\s*([^<]+) <([^>]+)>\s*$/i)) !==
      null
    ) {
      if (commit.reviewers === undefined || commit.reviewers === null) {
        commit.reviewers = []
      }
      commit.reviewers.push({ name: m[1], email: m[2] })
    } else if ((m = line.match(/^\s+PR(?:[- ]?URL)?:?\s*(.+)\s*$/) || line.match(/\(#(\d+)\)$/)) !== null) {
      commit.prUrl = m[1]
      if (
        typeof ghUser === 'string' &&
        ghUser.length !== 0 &&
        typeof ghProject === 'string' &&
        ghProject.length !== 0 &&
        (m = commit.prUrl.match(/^\s*#?(\d+)\s*$/)) !== null
      ) {
        commit.prUrl = `https://github.com/${ghUser}/${ghProject}/pull/${m[1]}`
      }
      if (
        (m = commit.prUrl.match(
          /^(https?:\/\/.+\/([^/]+)\/([^/]+))\/\w+\/(\d+)(\/)?$/i
        )) !== null
      ) {
        commit.ghIssue = parseInt(m[4])
        commit.ghUser = m[2]
        commit.ghProject = m[3]
      }
      if ((m = line.match(/^ {4}(.*)\s\(#\d+\)$/)) && !commit.summary) {
        commit.summary = m[1]
      }
    } else if (/^ {4}/.test(line) && (line = line.trim()).length !== 0) {
      if (commit.summary === undefined || commit.summary === null) {
        commit.summary = line
      } else {
        if (commit.description === undefined || commit.description === null) {
          commit.description = []
        }
        commit.description.push(line)
      }
    } else if (
      /^ [^ ]/.test(line) &&
      (line = line.trim()).length !== 0 &&
      (m = line.match(
        /^(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
      )) !== null
    ) {
      commit.changes = {
        files: parseInt(m[1]),
        insertions: parseInt(m[2] ?? 0),
        deletions: parseInt(m[3] ?? 0)
      }
    }

    return old
  }

  function onLine (line, _, callback) {
    const commit = addLine(line)

    if (commit?.authors?.length > 0) {
      commit.author = commit.authors[0]

      this.push(commit)
    }

    callback()
  }

  function onEnd (callback) {
    if (commit?.authors?.length > 0) {
      commit.author = commit.authors[0]

      this.push(commit)
    }

    callback()
  }
}
