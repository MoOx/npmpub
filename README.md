# npmpub [![NPM version](https://img.shields.io/npm/v/npmpub.svg?style=flat)](https://www.npmjs.com/package/npmpub)

> `npm publish` on steroid

## What is this?

The `npm publish` command is nice, but you always have to handle things before
(fresh tests) and after (tag, GitHub release)... So if you want to release
faster, just use this package/command!

- Pulls in remote git commits to ensure you publish the latest commit.
- Checks that a tag does not exist with the current version.
- Reinstalls dependencies to ensure your project works with a fresh dependency
  tree.
- Runs the tests.
- Publishes a new version to npm.
- Creates a git tag.
- Pushes commits and tags to GitHub.
- Edits the tag as a GitHub release based on the new version and corresponding
  changelog version
  (using [github-release-from-changelog](https://github.com/MoOx/github-release-from-changelog)).

## Requirements

- npm ( 5.7 if you don't use yarn - to use `npm ci`)
- yarn (optional)

_In order to make use this package and the "GitHub release" feature, you will
need a `$GITHUB_TOKEN` available as an env variable.
If you want to use everything except this feature, just use the `--no-release`
option (see below)._

- You can generate a
  [token from GitHub interface](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
- Put it in `~/.github_token`
- In your `.bashrc/zshrc`, export it by adding
  `export GITHUB_TOKEN=$(cat $HOME/.github_token)`.

## Install

```
$ npm install -D npmpub
# -- or --
$ yarn add --dev npmpub
```

## Usage

Since you are probably
[maintaining a CHANGELOG (or you should)](http://keepachangelog.com/), you
already handle by hand version number (because you care about
[semver](http://semver.org/), don't you?).

So here is how to use this command:

- Prepare your `CHANGELOG`. The best (and easy way) to do this is by
  preparing your changelog while you commit your features/fixes.
  It make the release process more easy.
  So when you commit an API change, a feature or a fix, add your commit message
  in your CHANGELOG prefixed by _Removed/Changed/Added/Fixed_.
- Update your version number in your `CHANGELOG`.
  It's very easy to choose a version number:
  - If you have at least a _Removed_ or a _Changed_, it's a **breaking change**,
    so increment the first number (X.y.z),
  - If you have _Added_ something, it's a **minor change**,
    so increment the second number (x.Y.z),
  - If you just have _Fixed_ something, it's a **patch**,
    so increment the last number (x.y.Z).
- Update your version number in your `package.json`
- Commit
- Run `npmpub` so have a clean release (fresh tests + tag + GitHub release
  notes)

## How to run `npmpub`?

There is two way:

```console
$ ./node_modules/.bin/npmpub
```

Or you can add a npm scripts in your `package.json`

```json
{
  "scripts": {
    "release": "npmpub"
  }
}
```

This way you can run

```console
$ npm run release
# -- or --
$ yarn release
```

## Options

```console
$ ./node_modules/.bin/npmpub --help

npmpub [options]

--help          Just what you are reading.
--verbose       Get some informations.
--debug         Get all informations about process.
--skip-status   Skip git status check (⚠︎ you might release unversionned stuff).
--skip-fetch    Skip git fetch to compare remote (⚠︎ you might not be able to push).
--skip-compare  Skip git comparison with origin (⚠︎ you might not be able to push).
--skip-cleanup  Skip node_modules cleanup (⚠︎ you might miss some dependencies changes).
--skip-test     Skip test (⚠︎ USE THIS VERY CAREFULLY).
--dry           No publish, just check that tests are ok.
--no-release    No GitHub release from changelog.
```

---

## CONTRIBUTING

- ⇄ Pull requests and ★ Stars are always welcome.
- For bugs and feature requests, please create an issue.

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)
