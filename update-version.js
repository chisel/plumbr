const fs = require('fs');
const path = require('path');
const version = process.argv[2]?.trim();
const swConfig = require(path.resolve(__dirname, 'ngsw-config.json'));
const packageJson = require(path.resolve(__dirname, 'package.json'));
const packageLockJson = require(path.resolve(__dirname, 'package-lock.json'));

if ( ! version ) throw new Error('No version specified!');

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
