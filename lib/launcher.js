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
    return `${target.scheme}://`;
}

function buildCommunityImportUrl(archivePath) {
    const absolutePath = path.resolve(archivePath);
    const url = new URL('deltamod-community://import');
    url.searchParams.set('path', absolutePath);
    return url.toString();
}

function openExternal(url, options = {}) {
    if (typeof url !== 'string' || !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        throw new Error('Refusing to open an invalid URL.');
    }
    if (options.dryRun) return url;

    let executable;
    let args;
    if (process.platform === 'win32') {
        executable = 'explorer.exe';
        args = [url];
    } else if (process.platform === 'darwin') {
        executable = 'open';
        args = [url];
    } else {
        executable = 'xdg-open';
        args = [url];
    }

    const child = spawn(executable, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
    });
    child.on('error', () => {});
    child.unref();
    return url;
}

module.exports = {
    TARGETS,
    buildAppUrl,
    buildCommunityImportUrl,
    openExternal,
    resolveTarget
};
