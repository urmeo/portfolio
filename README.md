# Portfolio

urme's research projects, education and interests. [View the portfolio](https://urmeo.github.io/portfolio/).

The site uses HTML, CSS and JavaScript and is hosted on GitHub Pages. It has no build step or package dependencies. Edit `index.html` for content, `assets/css/main.css` for styles and `assets/js/script.js` for navigation and theme controls.

## Run locally

From the repository directory named `portfolio`, use Python 3 to start a preview server:

```sh
python3 -m http.server 8000 --directory ..
```

Open [the local site](http://localhost:8000/portfolio/), [browser checks](http://localhost:8000/portfolio/tests/navigation.html) and [custom 404 page](http://localhost:8000/portfolio/404.html).

Python is only needed for this preview command; any static web server can serve the site. This Python server does not automatically use `404.html` for missing URLs, so open that page directly to check it.

For behavior changes, run the browser checks with normal motion and with your browser or system's reduced-motion setting enabled. Both runs should report zero failures.

For visual changes, check light and dark themes at desktop and mobile widths. Test links, images, keyboard navigation and visible focus. Check print preview to make sure all three sections are readable.

Corrections to content, links, accessibility and rendering are welcome; include the browser version and a screenshot when reporting a rendering issue.

[Security and privacy](SECURITY.md) describes browser storage and vulnerability reporting.

## License

Code: [MIT](LICENSE). Project media and institution logos retain their source rights.
