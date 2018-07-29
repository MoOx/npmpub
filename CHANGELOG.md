# 4.1.0 - 2018-07-29

- Use `npm install` if no lock files found (by @hudochenkov in [#25](https://github.com/MoOx/npmpub/pull/25)).

# 4.0.1 - 2018-06-07

- Fixed: annotated tags won't have "created with npmpub" anymore.

# 4.0.0 - 2018-06-07

- Use `yarn --frozen-lockfile` or `npm ci` for cleanup
- Fixed: tags are now annotated tags.

# 3.1.0 - 2016-03-12

- Added: `--skip-test`, because you might need it for shitty test runner
  (eg: `testling` don't like to be ran from another location).
  **That's a pretty stupid option, I agree.**

  _Recommended Usage: `npm test && npmpub --skip-test`._

# 3.0.3 - 2016-02-12

- Fixed: 3.0.2 deactivated auto GitHub release. This is now fixed.

# 3.0.2 - 2016-02-12

- Fixed: `--no-release` flag now works.

# 3.0.1 - 2016-01-20

- Fixed: "npm publish" should actually call "npm publish", not "npmPublish".

# 3.0.0 - 2016-01-20

**Complete rewrite using Node.js instead of sh.**

- Changed: bin is now "npmpub"
- Added: Does a GitHub release by default from the version number and the
  corresponding section in your changelog.
- Added: `--help` to see the help
- Added: `--verbose` to see some informations.
- Added: `--debug` to see all informations about process.
- Added: `--skip-status` to skip git status check
- Added: `--skip-fetch` to skip git fetch to compare remote
- Added: `--skip-compare` to skip git comparison with origin
- Added: `--skip-cleanup` to skip node_modules cleanup
- Added: `--dry` to skip npm publish, just to check that tests are ok.
- Added: `--no-release` to avoid the GitHub release from changelog.

# 2.0.0 - 2016-01-11

- Changed: do not rebase by default, but instead show a warning if relevant.
- Fixed: no more `*-trash` warnings (`trash` replaced by `trash-cli`).
- Added: show a warning if you have unstashed changes or remote is unreadable.

# 1.0.0 - 2015-10-04

✨ Initial release
