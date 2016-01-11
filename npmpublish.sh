#!/usr/bin/env sh

if test -n "$(git status --porcelain)"; then
  echo 'Unclean working tree. Commit or stash changes first.' >&2;
  exit 128;
fi

if ! git fetch --quiet 2>/dev/null; then
  echo 'There was a problem fetching your branch.' >&2;
  exit 128;
fi

if test "0" != "$(git rev-list --count --left-only @'{u}'...HEAD)"; then
  echo 'Remote history differ. Please pull changes.' >&2;
  exit 128;
fi

# get the current real path of this file so we can relative node_modules
# (in our case, trash-cli)
realPath=$(node -e "console.log(require('path').dirname(require('fs').realpathSync('$0')))")

# run test from a fresh node_modules
$realPath/node_modules/.bin/trash node_modules
npm install &&
npm test &&

# tag from current version in package.json
git tag $(node -e 'process.stdout.write(require("./package.json").version)') &&

# publish the tagged version
npm publish &&

# push tag
git push --follow-tags
