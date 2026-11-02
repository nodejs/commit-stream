import { Transform } from 'node:stream'
import { stripVTControlCharacters } from 'node:util'

/**
 * @typedef {Object} Person
 * @property {string} name
 * @property {string} email
 */

/**
 * @typedef {Object} Changes
 * @property {number} files
 * @property {number} insertions
 * @property {number} deletions
 */

/**
 * @typedef {Object} Commit
 * @property {string} sha
 * @property {Person} [author]
 * @property {Person[]} [authors]
 * @property {string} [authorDate]
 * @property {string} [commitDate]
 * @property {string} [summary]
 * @property {string[]} [description]
 * @property {Person[]} [reviewers]
 * @property {Changes} [changes]
 * @property {string} [prUrl]
 * @property {string} [ghUser]
 * @property {string} [ghProject]
 * @property {number} [ghIssue]
 * @property {string} [cveId]
 */

/**
 * Create an object stream that turns lines of `git log` output into commit objects.
 *
 * @param {string} [ghUser] - GitHub user used to expand short `#XX` PR references
 * @param {string} [ghProject] - GitHub project used to expand short `#XX` PR references
 * @returns {Transform}
 */
export default function commitStream (ghUser, ghProject) {
  /** @type {Commit | undefined} */
  let commit

  return new Transform({
    objectMode: true,
    transform (line, _, callback) {
      try {
        emit(this, addLine(line))
        callback()
      } catch (err) {
        callback(/** @type {Error} */ (err))
      }
    },
    flush (callback) {
      emit(this, commit)
      callback()
    }
  })

  /**
   * @param {string} line
   * @returns {Commit | undefined} the previous commit, when `line` starts a new one
   */
  function addLine (line) {
    line = stripVTControlCharacters(line)

    if (line.length === 0) return

    if (/^commit \w+$/.test(line)) {
      const old = commit
      commit = { sha: line.split(' ')[1] }
      return old
    }

    let m

    if (!commit) {
      throw new Error(`Unexpected line before first "commit" header: ${line}`)
    }

    if ((m = line.match(/^CommitDate:\s+(.*)$/)) !== null) {
      commit.commitDate = m[1].trim()
    } else if (
      (m = line.match(
        /^\s*(?:Author|Co[- ]?authored[- ]?by):?\s*([^<]+) <([^>]+)>\s*$/i
      )) !== null
    ) {
      (commit.authors ??= []).push({ name: m[1], email: m[2] })
    } else if ((m = line.match(/^(?:AuthorDate|Date):\s+(.*)$/)) !== null) {
      commit.authorDate = m[1].trim()
    } else if (
      (m = line.match(/^\s+Reviewed[- ]?By:?\s*([^<]+) <([^>]+)>\s*$/i)) !==
      null
    ) {
      (commit.reviewers ??= []).push({ name: m[1], email: m[2] })
    } else if ((m = line.match(/\bCVE-ID:\s+(CVE-\d{4}-\d{4,})\b/)) !== null) {
      commit.cveId = m[1]
    } else if ((m = line.match(/^\s+PR(?:[- ]?URL)?:?\s*(.+)\s*$/) || line.match(/\(#(\d+)\)$/)) !== null) {
      commit.prUrl = m[1]
      if (ghUser && ghProject && (m = commit.prUrl.match(/^\s*#?(\d+)\s*$/)) !== null) {
        commit.prUrl = `https://github.com/${ghUser}/${ghProject}/pull/${m[1]}`
      }
      if (
        (m = commit.prUrl.match(
          /^(https?:\/\/.+\/([^/]+)\/([^/]+))\/\w+\/(\d+)(\/)?$/i
        )) !== null
      ) {
        commit.ghIssue = Number(m[4])
        commit.ghUser = m[2]
        commit.ghProject = m[3]
      }
      if ((m = line.match(/^ {4}(.*)\s\(#\d+\)$/)) && !commit.summary) {
        commit.summary = m[1]
      }
    } else if (/^ {4}/.test(line) && (line = line.trim()).length !== 0) {
      if (commit.summary === undefined) {
        commit.summary = line
      } else {
        (commit.description ??= []).push(line)
      }
    } else if (
      /^ [^ ]/.test(line) &&
      (line = line.trim()).length !== 0 &&
      (m = line.match(
        /^(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
      )) !== null
    ) {
      commit.changes = {
        files: Number(m[1]),
        insertions: Number(m[2] ?? 0),
        deletions: Number(m[3] ?? 0)
      }
    }
  }
}

/**
 * Push a completed commit, skipping any without an author.
 *
 * @param {Transform} stream
 * @param {Commit | undefined} commit
 */
function emit (stream, commit) {
  if (commit?.authors?.length) {
    commit.author = commit.authors[0]
    stream.push(commit)
  }
}
