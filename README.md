# npmpub(lish)

> Another better `npm publish`

**Works great with [github-release-from-changelog](https://github.com/MoOx/github-release-from-changelog).**

## Why

- Pulls in remote git commits to ensure you publish the latest commit
- Reinstalls dependencies to ensure it works with the latest dependency tree
- Runs the tests
- Bumps the version from the one in package.json and creates a git tag
- Publishes the new version to npm
- Pushes commits and tags to GitHub

### What is the difference with `np`?

This `npmpublish` takes the version from the `package.json`.
I were using the orignal `np` recipe, but I discovered that I were always
already updating the version in the `CHANGELOG.md` by hand, so why not directly
specifying the version everywhere in the same commit?

## Install

```
$ npm install --global npmpub
```

**Note that the package is `npmpub` and the command is `npmpublish`.**

## Usage

```console
$ npmpublish
```

---

## CONTRIBUTING

* ⇄ Pull requests and ★ Stars are always welcome.
* For bugs and feature requests, please create an issue.

## [CHANGELOG](CHANGELOG.md)

## [LICENSE](LICENSE)
