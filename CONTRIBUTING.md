# Contributing

This is a personal portfolio site, so feature contributions are not expected. Corrections
are welcome: broken links, typos, accessibility problems, or rendering bugs in a browser you
can name.

## Running it locally

There is no build step and there are no dependencies. Serve the folder and open it:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Before opening a pull request

- Keep it to plain HTML, CSS, and JavaScript. No frameworks, no bundler.
- Check both the light and dark themes.
- Check the layout at a narrow width as well as desktop.
- Keep `index.html`, `main.css`, and `script.js` as the only source files.

If you are reporting a rendering bug rather than fixing one, an issue with the browser,
version, and a screenshot is more useful than a patch.
