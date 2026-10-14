# Contributing

Corrections to content, links, accessibility and rendering are welcome. Keep the site in plain HTML, CSS and JavaScript, with no build step. Include the browser version and a screenshot when reporting a rendering issue.

Follow the [README](README.md#run-locally) to preview the site. Open [the browser checks](http://localhost:8000/tests/navigation.html) with normal motion and with your browser or system's reduced-motion setting enabled. Both runs should report zero failures.

For visual changes, check light and dark themes at desktop and mobile widths. Test links, images and keyboard navigation, including visible focus. Check print preview to make sure all three sections are readable.

To preview the GitHub Pages path, run this command from the repository folder, assuming it is named `portfolio`:

```sh
python3 -m http.server 8000 --directory ..
```

Open [the subpath preview](http://localhost:8000/portfolio/), [browser checks](http://localhost:8000/portfolio/tests/navigation.html) and [custom 404 page](http://localhost:8000/portfolio/404.html). This server does not use `404.html` for missing URLs; open that page directly to check it.
