const chalk = require('chalk');
const fs = require('fs');

const app = require('./commands/app.js');
const init = require('./commands/init.js');
const importCmd = require('./commands/import.js');

function style(text, hex) {
    return chalk.hex(hex)(text);
}

process.on('SIGINT', () => {
    console.log('\n' + style('Run cancelled.', '#ff6464'));
    process.exit(0);
});

function log(...args) {
    console.log(style('deltamodCLI:','#639fff'), ...args);
}

var arguments = process.argv.slice(2);
var command = arguments[0];

module.exports = {
    log,
    style
};

// hardcoded since esbuild wants to kill me
switch (command) {
    case 'app':
        app();
        break;
    case 'init':
        init();
        break;
    case 'import':
        importCmd();
        break;
    default:
        log('requested command not found');
        process.exit(1);
        break;
}