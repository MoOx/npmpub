# 3.0.0 - 2016-01-20

**Complete rewrite using Node.js instead of sh.**

- Changed: bin is now "npmpub"
- Added: Does a GitHub release by default from the version number and the
  corresponding section in your changelog.
- Added: ``--help`` to see the help
- Added: ``--verbose`` to see some informations.
- Added: ``--debug`` to see all informations about process.
- Added: ``--skip-status`` to skip git status check
- Added: ``--skip-fetch`` to skip git fetch to compare remote
- Added: ``--skip-compare`` to skip git comparison with origin
- Added: ``--skip-cleanup`` to skip node_modules cleanup
- Added: ``--dry`` to skip npm publish, just to check that tests are ok.
- Added: ``--no-release`` to avoid the GitHub release from changelog.

# 2.0.0 - 2016-01-11

- Changed: do not rebase by default, but instead show a warning if relevant.
- Fixed: no more ``*-trash`` warnings (``trash`` replaced by ``trash-cli``).
- Added: show a warning if you have unstashed changes or remote is unreadable.

# 1.0.0 - 2015-10-04

✨ Initial release
