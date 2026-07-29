const chalk = require('chalk');

function style(text, hex) {
    return chalk.hex(hex)(text);
}

function log(...args) {
    console.log(style('Deltamod Community CLI:', '#6ec8ff'), ...args);
}

function warn(...args) {
    console.warn(style('Warning:', '#ffc56e'), ...args);
}

module.exports = {
    log,
    style,
    warn
};
