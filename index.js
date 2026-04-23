const chalk = require('chalk');
const fs = require('fs');

const app = require('./commands/app.js');
const init = require('./commands/init.js');
const importCmd = require('./commands/import.js');
const inspect = require('./commands/inspect.js');

const COMMANDS = {
    "app": {
        "desc": "Opens the Deltamod desktop app if installed.",
        "obj": app       
    },
    "init": {
        "desc": "Initializes a new Deltamod meta.json file in the current directory.",
        "obj": init
    },
    "import": {
        "desc": "Imports the Deltamod project to the Deltamod desktop app.",
        "obj": importCmd
    },
    "inspect": {
        "desc": "Inspects the current Deltamod project and displays its name and version.",
        "obj": inspect
    },
    "xml": {
        "desc": "Run the XML editor",
        "obj": require('./commands/xml.js')
    }
}

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

(async () => {
    if (command in COMMANDS) {
        await COMMANDS[command].obj(arguments.slice(1));
        process.exit(0);
    } else {
        log('command not found.');
        console.log(style('Available commands:', '#9ac1ff'));
        Object.keys(COMMANDS).forEach((cmd) => {
            console.log(`  ${chalk.bold(cmd)} - ${COMMANDS[cmd].desc}`);
        });
        process.exit(1);
    }
})();