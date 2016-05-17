"use strict";

const plan = require('flightplan');
const secret = require('./secret.json');
const globSync = require('glob').sync;

plan.target('production', {
  host: secret.host,
  username: secret.username,
  agent: process.env.SSH_AUTH_SOCK,
});

// plan.remote('provision', {
  // XXX: some day figure out how to provision node here:
  // curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
  // sudo apt-get install -y nodejs

  // XXX: by default you have to be sudo to do this (both due to /usr/lib/node_modules being
  // root-owned and /usr/lib/bin being root-owned...)
  // might be okay to chown but idk?
  // remote.npm('install -g forever');
// });

plan.remote((remote) => {
  remote.rm('-rf /tmp/manygolf', {failsafe: true});
});

plan.local((local) => {
  local.log('Building...');
  local.rm('-rf build');
  local.npm('run build');

  const srcFiles = local.git('ls-files', {silent: true}).stdout.split('\n');
  const buildFiles = globSync('build/**/*');
  const files = srcFiles.concat(buildFiles);

  local.log('Uploading files...');
  local.transfer(files, '/tmp/manygolf');
});

// Tells whether two files are different
function filesDiffer(remote, file1, file2) {
  const cmp = remote.exec(`cmp ${file1} ${file2}`, {failsafe: true, silent: true});

  // 0 = same, 1 = different, >1 = error
  if (cmp.code > 1) {
    throw new Error(`Error executing cmp: ${cmp.stderr}`);
  }

  return cmp.code === 1;
}

plan.remote((remote) => {
  remote.mkdir(`-p ${secret.path}`);
  remote.cd(secret.path);

  remote.with(`cd ${secret.path}`, () => {

    let shouldRestart;

    if (plan.runtime.options['force-restart']) {
      shouldRestart = true;

    } else {
      shouldRestart = filesDiffer(
        remote,
        'build/server.bundle.js',
        '/tmp/manygolf/build/server.bundle.js'
      );
    }

    if (shouldRestart) {
      remote.log('Will restart server!');
    } else {
      remote.log('Skipping server restart...');
    }

    remote.log('Replacing files...');

    remote.rm('-rf build');
    remote.cp('-r /tmp/manygolf/. .');

    // we serve out of build/ so copy index.html in there
    remote.cp('index.html build/');

    if (shouldRestart) {
      remote.log('Installing dependencies...');

      remote.npm('install --only=production');

      remote.log('Restarting app...');

      remote.exec('forever stop scripts/server-prod', {failsafe: true});

      remote.exec('sleep 5');  // lol

      remote.exec('forever start -c /bin/bash scripts/server-prod');
    }
  });
});
