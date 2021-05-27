const fs = require('fs');
const path = require('path');
const version = process.argv[2]?.trim();
const swConfig = require(path.resolve(__dirname, 'ngsw-config.json'));

swConfig.appData = { version };

fs.writeFileSync(
  path.resolve(__dirname, 'ngsw-config.json'),
  JSON.stringify(swConfig, null, 2)
);
