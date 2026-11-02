import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { test } from 'node:test'
import { promisify } from 'node:util'
import commitStream from './commit-stream.js'

async function toCommits (lines, user, repo) {
  const commits = []
  await pipeline(
    lines,
    commitStream(user, repo),
    async (source) => {
      for await (const commit of source) commits.push(commit)
    }
  )
  return commits
}

async function gitToList (args, user, repo) {
  const child = spawn('git', args)
  let stderr = ''
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })

  const [[code], list] = await Promise.all([
    once(child, 'close'),
    toCommits(createInterface({ input: child.stdout, crlfDelay: Infinity }), user, repo)
  ])

  assert.strictEqual(stderr, '')
  assert.strictEqual(code, 0, 'exit code zero')
  return list
}

test('git is runnable', async () => {
  const { stdout, stderr } = await promisify(execFile)('git', ['version'])
  assert.strictEqual(stderr, '')
  assert.match(stdout, /^git version 2/)
})

test('current plain commit log', async () => {
  const list = await gitToList(['log'])
  assert.ok(list.length > 0, 'got a list')
  assert.deepStrictEqual(
    list[list.length - 9],
    {
      author: { email: 'ralphtheninja@riseup.net', name: 'Lars-Magnus Skog' },
      authors: [
        { email: 'ralphtheninja@riseup.net', name: 'Lars-Magnus Skog' }
      ],
      authorDate: 'Tue Feb 9 15:46:46 2016 +0100',
      description: [
        'Fixes: https://github.com/rvagg/changelog-maker/issues/35'
      ],
      ghIssue: 1,
      ghProject: 'commit-stream',
      ghUser: 'rvagg',
      prUrl: 'https://github.com/rvagg/commit-stream/pull/1',
      sha: '1bcfd072fd74399808fbcd5cf31ce5342dd6d70c',
      summary: 'process: this should not match PR-URL',
      reviewers: [{ email: 'rod@vagg.org', name: 'Rod Vagg' }]
    },
    'got correct ninth commit'
  )

  assert.deepStrictEqual(
    list[list.length - 4],
    {
      author: { email: 'rod@vagg.org', name: 'Rod Vagg' },
      authors: [{ email: 'rod@vagg.org', name: 'Rod Vagg' }],
      authorDate: 'Fri Apr 17 11:16:51 2015 +1000',
      sha: 'f92b93c3c7175b07f847dd45058b121cea6b3a20',
      summary: 'deleted package.json line'
    },
    'got correct fourth commit'
  )

  assert.deepStrictEqual(
    list[list.length - 3],
    {
      author: { email: 'rod@vagg.org', name: 'Rod Vagg' },
      authors: [{ email: 'rod@vagg.org', name: 'Rod Vagg' }],
      authorDate: 'Fri Apr 17 11:13:06 2015 +1000',
      description: ['comment', 'Reviewed-By: Nobody'],
      sha: 'db34ce2af09a6a9fb70241d43965a2bc48b90b4c',
      summary: 'squished package.json'
    },
    'got correct third commit'
  )

  assert.deepStrictEqual(
    list[list.length - 2],
    {
      author: { email: 'rod@vagg.org', name: 'Rod Vagg' },
      authors: [{ email: 'rod@vagg.org', name: 'Rod Vagg' }],
      authorDate: 'Fri Apr 17 10:52:16 2015 +1000',
      description: [
        'Some extra summary information here',
        'newline',
        'Fixes: https://github.com/rvagg/commit-stream/issues/0'
      ],
      ghIssue: 0,
      ghProject: 'commit-stream',
      ghUser: 'rvagg',
      prUrl: 'https://github.com/rvagg/commit-stream/pulls/0',
      reviewers: [{ email: 'roger@vagg.org', name: 'Roger Vagg' }],
      sha: '6275758f597ae579202fbe4eccca1407f2c67ac1',
      summary: 'added test.js'
    },
    'got correct second commit'
  )

  assert.deepStrictEqual(
    list[list.length - 1],
    {
      sha: 'd94841274e2979e7758413a0f48fa37560d0dde6',
      authorDate: 'Thu Apr 16 20:49:21 2015 +1000',
      author: { name: 'Rod Vagg', email: 'rod@vagg.org' },
      authors: [{ email: 'rod@vagg.org', name: 'Rod Vagg' }],
      summary: 'make it so'
    },
    'got correct first commit'
  )

  assert.deepStrictEqual(
    list[list.length - 16],
    {
      sha: list[list.length - 16]?.sha, // unknown at time of writing :)
      authorDate: 'Tue Jun 12 23:41:35 2018 +0200',
      author: { name: 'Anna Henningsen', email: 'anna@addaleax.net' },
      authors: [
        { name: 'Anna Henningsen', email: 'anna@addaleax.net' },
        { name: 'nobody', email: 'nobody@nowhere' }
      ],
      summary: 'add support for co-authored-by'
    },
    'got correct co-authored-by commit'
  )
})

test('current commit log with changes', async () => {
  const list = await gitToList(['log', '--stat'])
  assert.ok(list.length > 0, 'got a list')
  assert.deepStrictEqual(
    list[list.length - 4]?.changes,
    {
      files: 1,
      insertions: 0,
      deletions: 1
    },
    'got correct second commit changes'
  )

  assert.deepStrictEqual(
    list[list.length - 3]?.changes,
    {
      files: 1,
      insertions: 1,
      deletions: 28
    },
    'got correct second commit changes'
  )

  assert.deepStrictEqual(
    list[list.length - 2]?.changes,
    {
      files: 1,
      insertions: 49,
      deletions: 0
    },
    'got correct second commit changes'
  )

  assert.deepStrictEqual(
    list[list.length - 1]?.changes,
    {
      files: 1,
      insertions: 28,
      deletions: 0
    },
    'got correct first commit changes'
  )
})

test('current commit log with ghUser and ghRepo passed', async () => {
  const list = await gitToList(['log'], 'rvagg', 'commit-stream')
  assert.ok(list.length > 1, 'got a list')

  assert.deepStrictEqual(list[list.length - 18], {
    sha: 'b23208796d7e3fd08b36f6106aa7f027aa827137',
    authors: [
      { name: 'Rich Trott', email: 'rtrott@gmail.com' }
    ],
    authorDate: 'Mon Oct 11 19:29:18 2021 -0700',
    prUrl: 'https://github.com/rvagg/commit-stream/pull/5',
    ghIssue: 5,
    ghUser: 'rvagg',
    ghProject: 'commit-stream',
    author: { name: 'Rich Trott', email: 'rtrott@gmail.com' },
    summary: 'chore: update strip-ansi to 6.x'
  }, 'got correct pr url for green-button merge')
})

test('cve id', async () => {
  const list = await gitToList(['log'], 'rvagg', 'commit-stream')
  assert.ok(list.length > 1, 'got a list')

  assert.deepStrictEqual(list[list.length - 30], {
    sha: '6c82ccd24e44167433126ba2bf4e95c8c4f41297',
    authors: [
      { name: 'RafaelGSS', email: 'rafael.nunu@hotmail.com' }
    ],
    authorDate: 'Fri Nov 22 00:19:29 2024 -0300',
    author: { name: 'RafaelGSS', email: 'rafael.nunu@hotmail.com' },
    summary: 'feat: add cveId support',
    cveId: 'CVE-2024-12345'
  }, 'got correct pr url for green-button merge')
})

test('cve id with 4 or more sequence digits', async () => {
  const log = (cveId) => [
    'commit 0000000000000000000000000000000000000000',
    'Author: RafaelGSS <rafael.nunu@hotmail.com>',
    'Date:   Fri Nov 22 00:19:29 2024 -0300',
    '',
    '    deps: fix vulnerability',
    '',
    `    CVE-ID: ${cveId}`
  ]
  const ids = ['CVE-2026-9358', 'CVE-2024-12345', 'CVE-2017-1000117']
  const commits = await toCommits(ids.flatMap(log))
  assert.deepStrictEqual(commits.map((c) => c.cveId), ids)
})
