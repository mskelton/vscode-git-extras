# Git Extras

Extra Git commands for VS Code

## Commands

- `Git Extras: Push` - Push changes to the remote repository
- `Git Extras: Pull` - Pull changes from the remote repository
- `Git Extras: Sync` - Sync changes to the remote repository
- `Git Extras: Append` - Append changes to the last commit
- `Git Extras: Push Force With Lease` - Run `git push --force-with-lease`
- `Git Extras: Checkout Default Branch` - Checkout the default branch
- `Git Extras: Copy Remote URL` - Copy a remote (e.g. GitHub) URL for the current file and
  line/selection. With no file open, copies the repository URL.
- `Git Extras: Open Blame` - Open the remote blame view for the current file and line.

## Configuration

GitHub is supported out of the box. To add support for other Git hosts, set `git-extras.remotes` in
your VS Code settings:

```json
"git-extras.remotes": [
  {
    "regex": "^git@gitlab\\.com:(.+?)(?:\\.git)?$",
    "repo": "https://gitlab.com/${1}",
    "file": "https://gitlab.com/${1}/-/blob/${sha}/${file}${line}",
    "blame": "https://gitlab.com/${1}/-/blame/${sha}/${file}${line}"
  }
]
```

Templates support `${1}`, `${2}`, ... for regex capture groups and `${sha}`, `${file}`, `${line}`
for file/blame URLs. URLs always reference the current commit SHA so the links remain stable as
branches move.

## Installation

### From VSIX file

1. Download the `.vsix` file
2. Install via Command Palette: "Extensions: Install from VSIX..."
3. Or use CLI: `code --install-extension git-extras-0.0.1.vsix`

### Development

1. Clone this repository
2. Run `npm install`
3. Press `F5` to launch Extension Development Host
4. Test the extension in the new VS Code window
