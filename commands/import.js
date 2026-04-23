function run() {
    const appdata = require('app-data-folder');
    let appDataPath = appdata('Deltamod');
    const { log, style } = require('../index.js');
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(appDataPath)) {
        log('Deltamod app data folder not found. creating...');
        fs.mkdirSync(appDataPath, { recursive: true });
        fs.mkdirSync(path.join(appDataPath, 'pkg.db'), { recursive: true });
    }

    log('importing to deltamod pkg.db...');

    let t = new Date().getTime();

    fs.cpSync(process.cwd(), path.join(appDataPath, 'pkg.db', 'DCLIMod-' + t), { recursive: true });

    log('import complete, opening deltamod...'); 

    require('./app.js')(true);

    process.exit(0);
}

module.exports = run;