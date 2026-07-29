const fs = require('fs');
const path = require('path');
const TOML = require('js-toml');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_PATCH_MANIFEST_BYTES = 4 * 1024 * 1024;
const MAX_PACKAGE_FILES = 10_000;
const MAX_PACKAGE_BYTES = 2 * 1024 * 1024 * 1024;
const SUPPORTED_PATCH_TYPES = new Set(['override', 'copy', 'xdelta', 'g3mpatch']);
const EXCLUDED_DIRECTORIES = new Set(['.git', '.deltamod-build']);
const EXCLUDED_FILES = new Set(['.DS_Store', 'Thumbs.db']);

function readLimited(filePath, maximumBytes) {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1) {
        throw new Error(`${path.basename(filePath)} must be a regular, non-linked file.`);
    }
    if (stat.size > maximumBytes) {
        throw new Error(`${path.basename(filePath)} exceeds the ${maximumBytes}-byte limit.`);
    }
    return fs.readFileSync(filePath, 'utf8');
}

function isSafeRelativePath(value) {
    if (typeof value !== 'string' || !value.trim() || value.includes('\0')) return false;
    const normalized = value.replaceAll('\\', '/');
    if (
        normalized.startsWith('/')
        || normalized.startsWith('//')
        || path.posix.isAbsolute(normalized)
        || path.win32.isAbsolute(value)
    ) return false;
    return !normalized.split('/').some(part => part === '..');
}

function resolveProjectPath(root, relativePath, mustExist) {
    if (!isSafeRelativePath(relativePath)) {
        throw new Error(`Unsafe project path "${relativePath}".`);
    }
    const absoluteRoot = path.resolve(root);
    const absolutePath = path.resolve(absoluteRoot, relativePath);
    const relative = path.relative(absoluteRoot, absolutePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Path "${relativePath}" escapes the project directory.`);
    }
    if (mustExist && !fs.existsSync(absolutePath)) {
        throw new Error(`Required project file "${relativePath}" does not exist.`);
    }
    return absolutePath;
}

function loadManifest(root) {
    const tomlPath = path.join(root, 'meta.toml');
    const jsonPath = path.join(root, 'meta.json');
    if (fs.existsSync(tomlPath)) {
        try {
            return {
                data: TOML.load(readLimited(tomlPath, MAX_MANIFEST_BYTES)),
                format: 'toml',
                path: tomlPath
            };
        } catch (error) {
            throw new Error(`meta.toml is invalid: ${error.message}`);
        }
    }
    if (fs.existsSync(jsonPath)) {
        try {
            return {
                data: JSON.parse(readLimited(jsonPath, MAX_MANIFEST_BYTES)),
                format: 'json',
                path: jsonPath
            };
        } catch (error) {
            throw new Error(`meta.json is invalid: ${error.message}`);
        }
    }
    throw new Error('No meta.toml or legacy meta.json manifest was found.');
}

function validateMetadata(manifest) {
    const metadata = manifest?.metadata;
    if (!metadata || typeof metadata !== 'object') {
        throw new Error('The manifest is missing the [metadata] section.');
    }
    const requiredStrings = ['name', 'version', 'packageID', 'game'];
    for (const field of requiredStrings) {
        if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
            throw new Error(`Manifest field metadata.${field} is required.`);
        }
    }
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(metadata.version)) {
        throw new Error('metadata.version must be a semantic version such as 1.0.0.');
    }
    if (!/^[a-z0-9][a-z0-9_-]{0,62}(?:\.[a-z0-9][a-z0-9_-]{0,62}){2}$/i.test(metadata.packageID)) {
        throw new Error('metadata.packageID must contain three safe dot-separated components.');
    }
    if (!/^[a-z0-9][a-z0-9_-]*(?:\.[a-z0-9][a-z0-9_-]*)+$/i.test(metadata.game)) {
        throw new Error('metadata.game is not a valid game code.');
    }
    if (metadata.author != null && !Array.isArray(metadata.author)) {
        throw new Error('metadata.author must be an array.');
    }
    return metadata;
}

function validatePatchManifest(root) {
    const xmlPath = path.join(root, 'modding.xml');
    if (!fs.existsSync(xmlPath)) throw new Error('modding.xml is missing.');
    const xml = readLimited(xmlPath, MAX_PATCH_MANIFEST_BYTES);
    if (!xml.trim()) throw new Error('modding.xml is empty.');

    const wrapped = `<deltamod>${xml}</deltamod>`;
    const validation = XMLValidator.validate(wrapped);
    if (validation !== true) {
        throw new Error(`modding.xml is invalid: ${validation.err.msg}`);
    }
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        processEntities: false,
        parseAttributeValue: false,
        parseTagValue: false
    });
    const document = parser.parse(wrapped);
    const rawPatches = document?.deltamod?.patch;
    const patches = rawPatches == null ? [] : (Array.isArray(rawPatches) ? rawPatches : [rawPatches]);
    if (patches.length === 0) throw new Error('modding.xml contains no patch entries.');

    for (const patch of patches) {
        const type = String(patch.type || '').toLowerCase();
        if (!SUPPORTED_PATCH_TYPES.has(type)) {
            throw new Error(`modding.xml uses unsupported patch type "${type}".`);
        }
        if (!isSafeRelativePath(patch.patch) || !isSafeRelativePath(patch.to)) {
            throw new Error('Every patch source and destination must be a safe relative path.');
        }
        const source = resolveProjectPath(root, patch.patch, true);
        const sourceStat = fs.lstatSync(source);
        if (!sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.nlink > 1) {
            throw new Error(`Patch source "${patch.patch}" must be a regular, non-linked file.`);
        }
    }
    return patches;
}

function collectProjectFiles(root, excludedAbsolutePaths = []) {
    const absoluteRoot = path.resolve(root);
    const exclusions = new Set(excludedAbsolutePaths.map(item => path.resolve(item)));
    const files = [];
    let totalBytes = 0;

    function visit(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
            if (entry.isFile() && EXCLUDED_FILES.has(entry.name)) continue;
            const absolute = path.join(directory, entry.name);
            if (exclusions.has(path.resolve(absolute))) continue;
            const stat = fs.lstatSync(absolute);
            if (stat.isSymbolicLink()) throw new Error(`Linked entry "${path.relative(absoluteRoot, absolute)}" is not allowed.`);
            if (stat.isDirectory()) {
                visit(absolute);
                continue;
            }
            if (!stat.isFile() || stat.nlink > 1) {
                throw new Error(`Entry "${path.relative(absoluteRoot, absolute)}" is not a regular, non-linked file.`);
            }
            totalBytes += stat.size;
            files.push({
                absolute,
                relative: path.relative(absoluteRoot, absolute).split(path.sep).join('/'),
                size: stat.size
            });
            if (files.length > MAX_PACKAGE_FILES) throw new Error(`The project exceeds ${MAX_PACKAGE_FILES} files.`);
            if (totalBytes > MAX_PACKAGE_BYTES) throw new Error('The project exceeds the 2 GiB package limit.');
        }
    }

    visit(absoluteRoot);
    return { files, totalBytes };
}

function validateProject(root = process.cwd(), options = {}) {
    const absoluteRoot = path.resolve(root);
    const rootStat = fs.lstatSync(absoluteRoot);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
        throw new Error('The project root must be a regular directory.');
    }
    const manifest = loadManifest(absoluteRoot);
    const metadata = validateMetadata(manifest.data);
    const patches = validatePatchManifest(absoluteRoot);
    const packageFiles = collectProjectFiles(absoluteRoot, options.excludedAbsolutePaths);
    return {
        root: absoluteRoot,
        manifest,
        metadata,
        patches,
        ...packageFiles
    };
}

module.exports = {
    MAX_PACKAGE_BYTES,
    MAX_PACKAGE_FILES,
    collectProjectFiles,
    isSafeRelativePath,
    loadManifest,
    resolveProjectPath,
    validateProject
};
