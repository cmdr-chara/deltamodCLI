# Deltamod Community CLI

Project tooling for creating, validating, packaging, and importing mods into
[Deltamod Community](https://github.com/cmdr-chara/deltamod).

This fork does not write directly to either Deltamod profile. `import` creates a
validated archive and opens that `.modarchive` through the operating system.
Current Deltamod Community packages register the file association, validate the
handoff path again, ask the user to confirm, and then complete the transaction
through the existing staged importer.

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

The Community target is the default. `app` uses a short-lived, content-checked
`.deltamod-open` marker in the CLI temporary directory so the same native file
association can launch Deltamod Community without shell interpolation or an
unsupported custom URL. Official Deltamod does not expose the Community file
handoff, so `--target official` creates the package, opens the application, and
leaves the final manual import to the user.

## Package safety

Before packaging, the CLI checks the manifest, semantic version, package ID,
game code, patch types, patch source files, relative destinations, file count,
expanded size, and linked filesystem entries. Git metadata and previous
`.deltamod-build` output are excluded.

The resulting `.modarchive` is still treated as untrusted by Deltamod Community,
which checks that the handoff is a regular absolute archive, asks for native
confirmation, and validates/extracts it in staging before committing it.

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