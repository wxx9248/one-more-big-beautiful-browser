# One More Big Beautiful Browser

## Getting Started

```bash
pnpm install
pnpm dev
```

## Install new packages

For `extension` and `web`, go to the respective directories and run `pnpm add <package>`.

For `server`, go to the `server` directory and run `uv pip install <package>`.

## Run the project

```bash
pnpm dev
```

A browser should pop up with the extension loaded. Note that **you have to open a new tab** to open the side panel. (idk why, I think it's a bug of WXT)

## Install the extension to your own browser

1. Check if `extension/.output/chrome-mv3-dev` exists. If not, run `pnpm dev`.
2. Go to `chrome://extensions/` in your browser.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `extension/.output/chrome-mv3-dev` directory.
5. The extension should now be loaded.
