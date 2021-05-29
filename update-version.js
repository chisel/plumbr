const fs = require('fs');
const path = require('path');
const version = process.argv[2]?.trim();
const swConfig = require(path.resolve(__dirname, 'ngsw-config.json'));
const packageJson = require(path.resolve(__dirname, 'package.json'));
const packageLockJson = require(path.resolve(__dirname, 'package-lock.json'));
const child = require('child_process');

if ( ! version ) throw new Error('No version specified!');

function spawn(command, ...args) {

  return new Promise((resolve, reject) => {

    child.spawn(command, args, {
      windowsHide: true,
      cwd: process.cwd(),
      stdio: 'inherit'
    })
    .on('close', resolve)
    .on('error', reject);

  });

}

swConfig.appData = { version };
packageJson.version = version;
packageLockJson.version = version;

fs.writeFileSync(
  path.resolve(__dirname, 'ngsw-config.json'),
  JSON.stringify(swConfig, null, 2)
);

fs.writeFileSync(
  path.resolve(__dirname, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

fs.writeFileSync(
  path.resolve(__dirname, 'package-lock.json'),
  JSON.stringify(packageLockJson, null, 2)
);

spawn('git', 'add', 'ngsw-config.json', 'package.json', 'package-lock.json')
.then(() => spawn('git', 'commit', '-m', `"v${version}"`))
.catch(console.error);
