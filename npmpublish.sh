#!/usr/bin/env sh
trashCli=$(node -e "var path = require('path');console.log(path.join(path.dirname(require('fs').realpathSync('$0')), 'node_modules/.bin/trash'))");
node "$trashCli" node_modules &&
git pull --rebase &&
npm install &&
npm test &&

git tag $(node -e 'process.stdout.write(require("./package.json").version)') &&

npm publish &&

git push --follow-tags
