#!/usr/bin/env node

const chalk = require('chalk');
const { log, style } = require('./lib/output');

const COMMANDS = Object.freeze({
    app: {
        description: 'Open Deltamod Community or official Deltamod.',
        run: require('./commands/app')
    },
    init: {
        description: 'Create a modern meta.toml manifest in a mod project.',
        run: require('./commands/init')
    },
    validate: {
        description: 'Validate the manifest, patch plan, paths, and package contents.',
        run: require('./commands/validate')
    },
    pack: {
        description: 'Build a validated .modarchive without importing it.',
        run: require('./commands/pack')
    },
    import: {
        description: 'Package the project and request a confirmed Community import.',
        run: require('./commands/import')
    },
    inspect: {
        description: 'Display the current project identity and validation state.',
        run: require('./commands/inspect')
    },
    xml: {
        description: 'Open the local modding.xml editor.',
        run: require('./commands/xml')
    }
});

function printHelp() {
    console.log(style('Deltamod Community CLI', '#6ec8ff'));
    console.log('Usage: deltamod-community <command> [options]\n');
    console.log(style('Commands:', '#a9ddff'));
    for (const [name, command] of Object.entries(COMMANDS)) {
        console.log(`  ${chalk.bold(name.padEnd(10))} ${command.description}`);
    }
    console.log('\nRun a command with --help for its options.');
}

async function main(argv = process.argv.slice(2)) {
    const [commandName, ...args] = argv;
    if (!commandName || commandName === 'help' || commandName === '--help' || commandName === '-h') {
        printHelp();
        return 0;
    }

    const command = COMMANDS[commandName];
    if (!command) {
        log(`Unknown command "${commandName}".`);
        printHelp();
        return 1;
    }

    await command.run(args);
    return 0;
}

process.on('SIGINT', () => {
    console.log(`\n${style('Operation cancelled.', '#ff7d7d')}`);
    process.exitCode = 130;
});

if (require.main === module) {
    main()
        .then(code => {
            process.exitCode = code;
        })
        .catch(error => {
            console.error(style(`Error: ${error.message}`, '#ff7d7d'));
            if (process.env.DELTAMOD_CLI_DEBUG === '1') console.error(error.stack);
            process.exitCode = 1;
        });
}

module.exports = {
    COMMANDS,
    main,
    printHelp
};
