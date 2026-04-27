# Git Extras

Extra Git commands for VS Code

## Commands

- `Git Extras: Push` (`git-extras.push`) - Push changes to the remote repository
- `Git Extras: Pull` (`git-extras.pull`) - Pull changes from the remote repository
- `Git Extras: Sync` (`git-extras.sync`) - Sync changes to the remote repository
- `Git Extras: Append` (`git-extras.append`) - Append changes to the last commit
- `Git Extras: Force Push with Lease` (`git-extras.push-force-with-lease`) - Run
  `git push --force-with-lease`
- `Git Extras: Checkout Default Branch` (`git-extras.checkout-default-branch`) - Checkout the
  default branch
- `Git Extras: Checkout File from Default Branch`
  (`git-extras.checkout-file-from-default-branch`) - Reset the current file to its version on the
  default branch
- `Git Extras: Copy Remote URL` (`git-extras.copy-remote-url`) - Copy a remote (e.g. GitHub) URL
  for the current file and line/selection. With no file open, copies the repository URL.
- `Git Extras: Open Blame` (`git-extras.open-blame`) - Open the remote blame view for the current
  file and line.

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
