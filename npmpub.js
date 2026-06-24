import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createInterface } from "node:readline/promises";

const require = createRequire(import.meta.url);

// Resolve a dependency's bin script from npmpub's own module tree, so it works
// whether npmpub is run via `npx`, installed as a dependency, or locally —
// regardless of how node_modules is hoisted.
const resolveBin = (pkgName, binName = pkgName) => {
  const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin[binName];
  return join(dirname(pkgJsonPath), bin);
};

import colors from "chalk";
import parseArgs from "minimist";
import trash from "trash";

// Minimal shelljs replacement: run a command through the shell, capture its
// output, and echo it unless `silent` is requested. stdin is inherited so
// commands that prompt (e.g. npm auth) keep working.
//
// `interactive: true` fully inherits stdio (stdout & stderr go straight to the
// terminal) instead of capturing them. This is required for npm's modern
// web-based auth flow: npm only prints its clickable "Authenticate at <url>"
// link and opens the browser when it detects a real TTY on stdout. With piped
// output npm falls back to a degraded mode and the link only surfaces once the
// command is done — too late to click. The trade-off is that result.stdout /
// result.stderr come back empty, so only use it for commands where we just
// care about the exit code.
const exec = (cmd, { silent = false, interactive = false } = {}) => {
  const result = spawnSync(cmd, {
    shell: true,
    encoding: "utf8",
    stdio: interactive ? "inherit" : ["inherit", "pipe", "pipe"],
    maxBuffer: 100 * 1024 * 1024,
  });
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  if (!interactive && !silent) {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }
  return { code: result.status == null ? 1 : result.status, stdout, stderr };
};
const exit = (code) => process.exit(code);

const argv = parseArgs(process.argv.slice(2), {
  // `tag` takes a value (the npm dist-tag); everything else is a boolean flag.
  // We can't use `boolean: true` globally here because it would also coerce
  // `--tag beta` into `tag: true` and drop "beta" as a positional argument.
  string: ["tag"],
  default: {
    release: true,
  },
});

const print = (msg) => console.log("📦  " + msg);
const notice = (msg) => print(colors.yellow.bold(msg));
const log = (msg) => argv.verbose && print(colors.yellow(msg));
const debug = (msg) => argv.debug && print(msg);
const error = (msg) => print(colors.red.bold(msg));

const cmds = {
  isYarn: join(process.cwd(), "yarn.lock"),
  isPackageLockPresent: join(process.cwd(), "package-lock.json"),
  install: undefined, // defined after isYarn test
  gitStatus: "git status --porcelain",
  gitFetch: "git fetch --quiet",
  gitCheckRemote: "git rev-list --count --left-only @'{u}'...HEAD",
};

if (argv["help"]) {
  console.log(`npmpub [options]

  --help          Just what you are reading.
  --verbose       Get some informations.
  --debug         Get all informations about process.
  --skip-status   Skip git status check (⚠︎ you might release unversionned stuff).
  --skip-fetch    Skip git fetch to compare remote (⚠︎ you might not be able to push).
  --skip-compare  Skip git comparison with origin (⚠︎ you might not be able to push).
  --skip-cleanup  Skip node_modules cleanup (⚠︎ you might miss some dependencies changes).
  --skip-test     Skip test (⚠︎ USE THIS VERY CAREFULLY).
  --otp           Prompt for a 2FA one-time-password and pass it to npm. Optional:
                  without it, npm's web-based auth flow is used (clickable link,
                  browser-filled code), which is usually faster.
  --public        Set access to public when publishing @scoped/package
  --tag <tag>     Publish under a given npm dist-tag (e.g. beta, legacy-v6) instead of latest
  --dry           No publish, just check that tests are ok.
  --no-release    No GitHub release from changelog.
`);
  exit(0);
}

const execOpts = { silent: !argv.debug };

// check if yarn is used
debug(cmds.isYarn);
const isYarn = existsSync(cmds.isYarn);
if (isYarn) {
  log("Yarn detected.");
}

// check if package-lock is used
debug(cmds.isPackageLockPresent);
const isPackageLockPresent = existsSync(cmds.isPackageLockPresent);
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
  if (gitStatus.code !== 0 || gitStatus.stdout !== "") {
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
  if (gitCheckRemote.stdout !== "0\n") {
    error("Remote history differ. Please pull changes.");
    exit(1);
  } else {
    log("Git local copy up to date.");
  }
}

const pkg = join(process.cwd(), "package.json");
log("package.json is '" + pkg + "'.");
const version = JSON.parse(readFileSync(pkg, "utf8")).version;
notice("Preparing v" + version + ".");

log("Checking existing tags.");
const gitTags = exec("git tag", { silent: true });
if (gitTags.code !== 0) {
  error("Can't read tags.");
  exit(1);
} else if (gitTags.stdout.split("\n").indexOf(version) > -1) {
  error("Tag already exist.");
  exit(1);
}

let cleanupPromise;
if (argv["skip-cleanup"]) {
  log("Cleanup skipped.");
  cleanupPromise = Promise.resolve();
} else {
  log("Cleaning node_modules.");
  const nodeModules = join(process.cwd(), "node_modules");
  if (argv.verbose) {
    debug("Will delete '" + nodeModules + "'.");
  }
  cleanupPromise = trash([nodeModules]).then(() => {
    log("node_modules deleted.");

    notice("Running '" + cmds.install + "'. This can take a while.");
    const install = exec(cmds.install, execOpts);
    if (install.code !== 0) {
      console.log(install.stderr);
      error(cmds.install + " failed.");
      exit(1);
    }
  });
}

cleanupPromise
  .then(async () => {
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
      const flags = [];
      // prompt user to enter npm's two-factor authentication's one-time-password
      if (argv["otp"]) {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const otp = (await rl.question("Enter OTP:")).trim();
        rl.close();
        flags.push(`--otp=${otp}`);
      }

      if (argv["public"]) {
        // is needed for (public) scoped npm packages
        flags.push("--access=public");
      }

      // publish under a given npm dist-tag (e.g. beta, legacy-v6) instead of the
      // default "latest" — useful for prereleases or maintenance branches
      if (argv["tag"]) {
        flags.push(`--tag=${argv["tag"]}`);
      }

      notice("Publishing" + (argv["tag"] ? ` under tag '${argv["tag"]}'` : "") + "...");
      // Run interactively so npm's web-based auth flow works: when no --otp is
      // given and 2FA is required, npm prints a clickable link and waits for the
      // browser to confirm — much faster than copy-pasting a code by hand.
      const npmPublish = exec(`npm publish ${flags.join(" ")}`, { interactive: true });
      if (npmPublish.code !== 0) {
        error("Publishing failed.");
        exit(1);
      }

      log("Tagging.");
      const gitTag = exec('git tag -m "Release version ' + version + '" -a ' + version);
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
        const githubReleaseBin = resolveBin("github-release-from-changelog");
        const githubRelease = exec(`node "${githubReleaseBin}"`);
        if (githubRelease.code !== 0) {
          error("GitHub release failed.");
          exit(1);
        }
      }
    }
  })
  .catch((err) => {
    if (err) {
      setTimeout(() => {
        throw err;
      }, 1);
    } else {
      exit(1);
    }
  });
