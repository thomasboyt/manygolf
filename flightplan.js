'use strict';

const plan = require('flightplan');
const secret = require('./secret.json');
const globSync = require('glob').sync;

const sshConfig = {
  host: secret.host,
  username: secret.username,
  agent: process.env.SSH_AUTH_SOCK,
};

plan.target('production', sshConfig, secret.environments.production);
plan.target('client-staging', sshConfig, secret.environments['client-staging']);

plan.remote((remote) => {
  remote.rm(`-rf ${getTmpPath()}`, {failsafe: true});
});

plan.local((local) => {
  local.log('Building...');
  local.npm('run build-client');

  const files = globSync('build/client/**/*')
    .concat(globSync('static/**/*'));

  local.log('Uploading files...');
  local.transfer(files, getTmpPath());
});

function getWebRoot() {
  return plan.runtime.options.path;
}

function getTmpPath() {
  return `/tmp/manygolf-${plan.runtime.target}`;
}

plan.remote((remote) => {
  remote.log('Replacing files...');

  const outPath = getWebRoot();
  const tmpPath = getTmpPath();

  remote.rm(`-rf ${outPath}`, {failsafe: true});
  remote.mkdir(`-p ${outPath}`);
  remote.cd(outPath);

  remote.with(`cd ${outPath}`, () => {
    remote.cp(`-r ${tmpPath}/build/client/* .`);
    remote.cp(`-r ${tmpPath}/static/* .`);
  });
});