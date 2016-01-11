#!/usr/bin/env sh
git pull --rebase &&

# get the current real path of this file so we can relative node_modules
# (in our case, trash-cli)
realPath=$(node -e "console.log(require('path').dirname(require('fs').realpathSync('$0')))")

# run test from a fresh node_modules
$realPath/node_modules/.bin/trash node_modules
npm install &&
npm test &&

git tag $(node -e 'process.stdout.write(require("./package.json").version)') &&

npm publish &&

git push --follow-tags
