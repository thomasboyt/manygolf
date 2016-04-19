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
//
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

plan.remote((remote) => {
  remote.mkdir(`-p ${secret.path}`);
  remote.cd(secret.path);

  remote.with(`cd ${secret.path}`, () => {
    remote.log('Replacing files...');

    remote.rm('-rf build');
    remote.cp('-r /tmp/manygolf/. .');

    // we serve out of build/ so copy index.html in there
    remote.cp('index.html build/');

    remote.log('Installing dependencies...');

    remote.npm('install --only=production');

    remote.log('Restarting app...');

    remote.exec('forever stop scripts/server-prod', {failsafe: true});
    remote.exec('forever start -c /bin/bash scripts/server-prod');
  });
});
