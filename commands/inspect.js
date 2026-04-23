const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function style(text, hex) {
    return chalk.hex(hex)(text);
}

function log(...args) {
    console.log(style('deltamodCLI:','#639fff'), ...args);
}


function run() {
    let meta;
    try {
        meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'meta.json'), 'utf-8')).metadata;
    }
    catch (e) {
        log('No project found in current directory');
        return;
    }
    
    log('You are currently editing project "' + meta.name + '", version ' + meta.version);
}

module.exports = run;