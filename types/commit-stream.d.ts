import { Transform } from 'node:stream';
export type Person = {
    name: string;
    email: string;
};
export type Changes = {
    files: number;
    insertions: number;
    deletions: number;
};
export type Commit = {
    sha: string;
    author?: Person;
    authors?: Person[];
    authorDate?: string;
    commitDate?: string;
    summary?: string;
    description?: string[];
    reviewers?: Person[];
    changes?: Changes;
    prUrl?: string;
    ghUser?: string;
    ghProject?: string;
    ghIssue?: number;
    cveId?: string;
};
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
export default function commitStream(ghUser?: string, ghProject?: string): Transform;
//# sourceMappingURL=commit-stream.d.ts.map