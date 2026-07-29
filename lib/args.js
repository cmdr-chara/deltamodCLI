function parseArgs(args, valueOptions = []) {
    const values = {};
    const flags = new Set();
    const positionals = [];
    const expectedValues = new Set(valueOptions);

    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];
        if (!token.startsWith('--')) {
            positionals.push(token);
            continue;
        }

        const separator = token.indexOf('=');
        const name = separator === -1 ? token.slice(2) : token.slice(2, separator);
        if (!name) throw new Error('An empty option was provided.');

        if (expectedValues.has(name)) {
            const value = separator === -1 ? args[index + 1] : token.slice(separator + 1);
            if (!value || (separator === -1 && value.startsWith('--'))) {
                throw new Error(`Option --${name} requires a value.`);
            }
            values[name] = value;
            if (separator === -1) index += 1;
            continue;
        }

        if (separator !== -1) throw new Error(`Unknown option --${name}.`);
        flags.add(name);
    }

    return { flags, positionals, values };
}

function rejectUnknownOptions(parsed, allowedFlags = [], allowedValues = []) {
    const knownFlags = new Set(allowedFlags);
    const knownValues = new Set(allowedValues);
    for (const flag of parsed.flags) {
        if (!knownFlags.has(flag)) throw new Error(`Unknown option --${flag}.`);
    }
    for (const option of Object.keys(parsed.values)) {
        if (!knownValues.has(option)) throw new Error(`Unknown option --${option}.`);
    }
}

module.exports = {
    parseArgs,
    rejectUnknownOptions
};
