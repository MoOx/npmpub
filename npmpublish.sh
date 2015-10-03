#!/usr/bin/env sh
./node_modules/.bin/trash node_modules &>/dev/null;
git pull --rebase &&
npm install &&
npm test &&

git tag $(node -e 'process.stdout.write(require("./package.json").version)') &&

npm publish &&

git push --follow-tags
