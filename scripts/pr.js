#!/usr/bin/env node
/**
 * pr.js — One-command PR workflow.
 *
 * Creates a feature branch off the base branch (default: main), commits your
 * working-tree changes, pushes the branch, and opens a pull request.
 *
 * Uses the GitHub CLI (`gh`) when available. If `gh` is not installed it
 * falls back to pushing the branch and opening the GitHub "compare" page in
 * your browser so you can finish the PR there.
 *
 * Usage:
 *   node scripts/pr.js                         # interactive-ish, sensible defaults
 *   node scripts/pr.js -m "Add login screen"   # use this as the commit + PR title
 *   node scripts/pr.js -b fix/crash-on-start   # explicit branch name
 *   node scripts/pr.js --base develop          # PR against a different base branch
 *   node scripts/pr.js --draft                 # open the PR as a draft
 *   node scripts/pr.js --no-commit             # don't commit; PR existing commits only
 *
 * Flags:
 *   -m, --message <text>   Commit message / PR title.
 *   -b, --branch  <name>   Branch name to create or reuse.
 *       --base    <name>   Base branch for the PR (default: main).
 *       --draft            Open the PR as a draft.
 *       --no-commit        Skip staging/committing; PR whatever is already committed.
 *   -h, --help             Show this help.
 */

const { execSync, spawnSync } = require('child_process');

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function runLoud(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function tryRun(cmd) {
  try {
    return run(cmd);
  } catch {
    return null;
  }
}

function has(bin) {
  const probe = process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`;
  try {
    execSync(probe, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = (msg) => console.log(`${c.cyan}›${c.reset} ${msg}`);
const ok = (msg) => console.log(`${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`${c.yellow}!${c.reset} ${msg}`);
function die(msg) {
  console.error(`${c.red}✗ ${msg}${c.reset}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const o = { base: 'main', draft: false, commit: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-m':
      case '--message':
        o.message = argv[++i];
        break;
      case '-b':
      case '--branch':
        o.branch = argv[++i];
        break;
      case '--base':
        o.base = argv[++i];
        break;
      case '--draft':
        o.draft = true;
        break;
      case '--no-commit':
        o.commit = false;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        // Allow a bare message: node scripts/pr.js "my message"
        if (!a.startsWith('-') && !o.message) o.message = a;
    }
  }
  return o;
}

function printHelp() {
  const header = require('fs')
    .readFileSync(__filename, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith(' *') || l.startsWith('/**'))
    .map((l) => l.replace(/^\/?\*+ ?/, ''))
    .join('\n');
  console.log(header);
}

// Turn a message into a safe branch slug.
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2));

  // Must be inside a git repo.
  if (!tryRun('git rev-parse --is-inside-work-tree')) {
    die('Not inside a git repository.');
  }

  // Must have a remote.
  const remote = tryRun('git remote get-url origin');
  if (!remote) die('No "origin" remote configured. Add one with: git remote add origin <url>');

  const currentBranch = run('git rev-parse --abbrev-ref HEAD');
  const dirty = run('git status --porcelain').length > 0;

  // ---- Decide the working branch -----------------------------------------
  let branch = opts.branch;
  if (!branch) {
    if (currentBranch !== opts.base) {
      // Already on a feature branch — just use it.
      branch = currentBranch;
    } else if (opts.message) {
      branch = `feat/${slugify(opts.message)}`;
    } else {
      die(
        `You are on "${opts.base}". Provide a branch (-b name) or a message (-m "...") to derive one.`
      );
    }
  }

  // ---- Create / switch to the branch -------------------------------------
  if (branch !== currentBranch) {
    const exists = tryRun(`git rev-parse --verify ${branch}`);
    if (exists) {
      log(`Switching to existing branch ${c.yellow}${branch}${c.reset}`);
      runLoud(`git checkout ${branch}`);
    } else {
      log(`Creating branch ${c.yellow}${branch}${c.reset} off ${opts.base}`);
      // Make sure base is current before branching from it.
      tryRun(`git fetch origin ${opts.base}`);
      runLoud(`git checkout -b ${branch}`);
    }
  } else {
    log(`On branch ${c.yellow}${branch}${c.reset}`);
  }

  // ---- Commit -------------------------------------------------------------
  if (opts.commit && dirty) {
    const msg = opts.message || `Update ${branch}`;
    log('Staging and committing changes…');
    runLoud('git add -A');
    // Use spawnSync to pass the message safely (no shell-escaping headaches).
    const res = spawnSync('git', ['commit', '-m', msg], { stdio: 'inherit' });
    if (res.status !== 0) die('git commit failed.');
    ok(`Committed: ${msg}`);
  } else if (opts.commit && !dirty) {
    warn('No working-tree changes to commit.');
  } else {
    warn('Skipping commit (--no-commit).');
  }

  // Nothing to PR if the branch has no commits beyond base.
  const ahead = tryRun(`git rev-list --count ${opts.base}..${branch}`);
  if (ahead === '0') {
    die(`Branch "${branch}" has no commits ahead of "${opts.base}". Nothing to open a PR for.`);
  }

  // ---- Push ---------------------------------------------------------------
  log(`Pushing ${branch} to origin…`);
  runLoud(`git push -u origin ${branch}`);
  ok('Pushed.');

  const title = opts.message || branch;

  // ---- Open the PR --------------------------------------------------------
  if (has('gh')) {
    log('Creating pull request via gh…');
    const args = [
      'pr',
      'create',
      '--base',
      opts.base,
      '--head',
      branch,
      '--title',
      title,
      '--fill', // body from commits if not provided
    ];
    if (opts.draft) args.push('--draft');
    // --fill conflicts with an explicit title in older gh; keep title and drop body fill is fine.
    const res = spawnSync('gh', args, { stdio: 'inherit' });
    if (res.status !== 0) {
      warn('gh pr create failed (maybe a PR already exists). Opening it in the browser…');
      spawnSync('gh', ['pr', 'view', '--web'], { stdio: 'inherit' });
    } else {
      ok('Pull request created.');
      spawnSync('gh', ['pr', 'view', '--web'], { stdio: 'inherit' });
    }
  } else {
    // Fallback: open the GitHub compare page in the browser.
    warn('GitHub CLI (gh) not found — opening the PR page in your browser instead.');
    warn('Install it later for one-step PRs: https://cli.github.com/');

    const webUrl = remote
      .replace(/^git@github\.com:/, 'https://github.com/')
      .replace(/\.git$/, '');
    const compareUrl = `${webUrl}/compare/${opts.base}...${branch}?expand=1`;

    const opener =
      process.platform === 'win32'
        ? `start "" "${compareUrl}"`
        : process.platform === 'darwin'
        ? `open "${compareUrl}"`
        : `xdg-open "${compareUrl}"`;
    tryRun(opener);
    ok(`Open this to finish the PR:\n   ${compareUrl}`);
  }
}

main();
