const path = require("path");

const colors = require("chalk");
const sh = require("shelljs");
const parseArgs = require("minimist");
const trash = require("trash");

const exec = sh.exec;
const exit = sh.exit;

const argv = parseArgs(process.argv.slice(2), {
  boolean: true,
  default: {
    release: true
  }
});

const print = msg => console.log("📦  " + msg);
const notice = msg => print(colors.yellow.bold(msg));
const log = msg => argv.verbose && print(colors.yellow(msg));
const debug = msg => argv.debug && print(msg);
const error = msg => print(colors.red.bold(msg));

const cmds = {
  isYarn: "ls yarn.lock",
  isPackageLockPresent: "ls package-lock.json",
  install: undefined, // defined after isYarn test
  gitStatus: "git status --porcelain",
  gitFetch: "git fetch --quiet",
  gitCheckRemote: "git rev-list --count --left-only @'{u}'...HEAD"
};

if (argv["help"]) {
  /* eslint-disable max-len */
  console.log(`npmpub [options]

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
`);
  /* eslint-enable max-len */
  exit(0);
}

const execOpts = { silent: !argv.debug };

// check if yarn is used
debug(cmds.isYarn);
const isYarn = exec(cmds.isYarn, execOpts).code === 0;
if (isYarn) {
  log("Yarn detected.");
}

// check if package-lock is used
debug(cmds.isPackageLockPresent);
const isPackageLockPresent =
  exec(cmds.isPackageLockPresent, execOpts).code === 0;
if (isPackageLockPresent) {
  log("package-lock.json detected.");
}

if (isYarn) {
  cmds.install = "yarn --frozen-lockfile";
} else if (isPackageLockPresent) {
  cmds.install = "npm ci";
} else {
  cmds.install = "npm install";
}

// check clean status
if (argv["skip-status"]) {
  log("Git status check skipped.");
} else {
  debug(cmds.gitStatus);
  const gitStatus = exec(cmds.gitStatus, execOpts);
  if (gitStatus.code !== 0 || gitStatus.output !== "") {
    error("Unclean working tree. Commit or stash changes first.");
    exit(1);
  } else {
    log("Git working directory clean.");
  }
}

// fetch remote
if (argv["skip-fetch"]) {
  log("Git fetch skipped.");
} else {
  debug(cmds.gitFetch);
  const gitFetch = exec(cmds.gitFetch, execOpts);
  if (gitFetch.code !== 0) {
    error("There was a problem fetching your branch.");
    exit(1);
  } else {
    log("Git fetch done.");
  }
}

// compare remote
if (argv["skip-compare"]) {
  log("Git comparison skipped.");
} else {
  debug(cmds.gitCheckRemote);
  const gitCheckRemote = exec(cmds.gitCheckRemote, execOpts);
  if (gitCheckRemote.output !== "0\n") {
    error("Remote history differ. Please pull changes.");
    exit(1);
  } else {
    log("Git local copy up to date.");
  }
}

const pkg = path.join(process.cwd(), "package.json");
log("package.json is '" + pkg + "'.");
const version = require(pkg).version;
notice("Preparing v" + version + ".");

log("Checking existing tags.");
const gitTags = exec("git tag", { silent: true });
if (gitTags.code !== 0) {
  error("Can't read tags.");
  exit(1);
} else if (gitTags.output.split("\n").indexOf(version) > -1) {
  error("Tag already exist.");
  exit(1);
}

let cleanupPromise;
if (argv["skip-cleanup"]) {
  log("Cleanup skipped.");
  cleanupPromise = Promise.resolve();
} else {
  log("Cleaning node_modules.");
  const nodeModules = path.join(process.cwd(), "node_modules");
  if (argv.verbose) {
    debug("Will delete '" + nodeModules + "'.");
  }
  cleanupPromise = trash([nodeModules]).then(() => {
    log("node_modules deleted.");

    notice("Running '" + cmds.install + "'. This can take a while.");
    return new Promise(resolve => {
      exec(cmds.install, execOpts, (code, stdout, stderr) => {
        if (code === 0) {
          resolve();
        } else {
          console.log(stderr);
          error(cmds.install + " failed.");
          exit(1);
        }
      });
    });
  });
}

cleanupPromise
  .then(() => {
    if (argv["skip-test"]) {
      log("Test skipped.");
    } else {
      notice("Running tests...");
      const npmTest = exec("npm test");
      if (npmTest.code !== 0) {
        throw new Error("'npm test' failed.");
      }
    }

    if (argv.dry) {
      notice("Dry run. No publish.");
    } else {
      notice("Publishing...");
      const npmPublish = exec("npm publish");
      if (npmPublish.code !== 0) {
        error("Publishing failed.");
        exit(1);
      }

      log("Tagging.");
      const gitTag = exec(
        'git tag -m "Release version ' + version + '" -a ' + version
      );
      if (gitTag.code !== 0) {
        error("Tagging failed.");
        exit(1);
      }

      log("Git push.");
      const gitPush = exec("git push --follow-tags");
      if (gitPush.code !== 0) {
        error("pushing failed.");
        exit(1);
      }

      if (!argv["release"]) {
        log("No GitHub release.");
      } else {
        log("GitHub release.");
        const githubRelease = exec(
          "./node_modules/.bin/github-release-from-changelog"
        );
        if (githubRelease.code !== 0) {
          error("GitHub release failed.");
          exit(1);
        }
      }
    }
  })
  .catch(err => {
    if (err) {
      setTimeout(() => {
        throw err;
      }, 1);
    } else {
      exit(1);
    }
  });
