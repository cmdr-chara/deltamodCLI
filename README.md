# Deltamod Community CLI

Project tooling for creating, validating, packaging, and importing mods into
[Deltamod Community](https://github.com/cmdr-chara/deltamod).

This fork does not write directly to either Deltamod profile. `import` creates a
validated archive and asks Deltamod Community to confirm and complete the
transaction through its own staged importer.

## Commands

```text
deltamod-community init [project]
deltamod-community validate [project]
deltamod-community inspect [project]
deltamod-community pack [project] [--output file.modarchive]
deltamod-community import [project] [--target community|official]
deltamod-community app [--target community|official]
deltamod-community xml [project]
```

The Community target is the default. Official Deltamod does not expose a safe
local-import protocol, so `--target official` only creates the package, opens
the application, and leaves the final manual import to the user.

## Package safety

Before packaging, the CLI checks the manifest, semantic version, package ID,
game code, patch types, patch source files, relative destinations, file count,
expanded size, and linked filesystem entries. Git metadata and previous
`.deltamod-build` output are excluded.

The resulting `.modarchive` is still treated as untrusted by Deltamod Community,
which validates and extracts it in staging before committing it.

## Development

Requires Node.js 22 or newer.

```powershell
npm ci
npm test
npm run check
npm run build
```

The standalone executable is unsigned during the beta period.

## License

ISC. This repository is a fork of
[deltamodders/deltamodCLI](https://github.com/deltamodders/deltamodCLI).
