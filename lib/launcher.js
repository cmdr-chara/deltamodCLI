const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const TARGETS = Object.freeze({
    community: {
        label: 'Deltamod Community',
        scheme: 'deltamod-community'
    },
    official: {
        label: 'Deltamod',
        scheme: 'deltamod'
    }
});

function resolveTarget(value = 'community') {
    const key = String(value).trim().toLowerCase();
    if (!Object.hasOwn(TARGETS, key)) {
        throw new Error(`Unknown target "${value}". Use "community" or "official".`);
    }
    return { key, ...TARGETS[key] };
}

function buildAppUrl(targetName) {
    const target = resolveTarget(targetName);
    if (target.key === 'community') {
        throw new Error('Deltamod Community uses the native file handoff, not a custom URL.');
    }
    return `${target.scheme}://`;
}

function spawnDetached(executable, args) {
    const child = spawn(executable, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
    });
    child.on('error', () => {});
    child.unref();
}

function openExternal(url, options = {}) {
    if (typeof url !== 'string' || !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        throw new Error('Refusing to open an invalid URL.');
    }
    if (options.dryRun) return url;

    if (process.platform === 'win32') {
        spawnDetached('explorer.exe', [url]);
    } else if (process.platform === 'darwin') {
        spawnDetached('open', [url]);
    } else {
        spawnDetached('xdg-open', [url]);
    }
    return url;
}

function openPath(filePath, options = {}) {
    const absolutePath = path.resolve(filePath);
    if (!options.dryRun) {
        const stat = fs.lstatSync(absolutePath);
        if (!stat.isFile() || stat.isSymbolicLink()) {
            throw new Error('Refusing to open a linked or non-file handoff path.');
        }
    }

    if (options.dryRun) return absolutePath;
    if (process.platform === 'win32') {
        spawnDetached('explorer.exe', [absolutePath]);
    } else if (process.platform === 'darwin') {
        spawnDetached('open', [absolutePath]);
    } else {
        spawnDetached('xdg-open', [absolutePath]);
    }
    return absolutePath;
}

module.exports = {
    TARGETS,
    buildAppUrl,
    openExternal,
    openPath,
    resolveTarget
};