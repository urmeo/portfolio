# Contributing

- Serve this folder with `python3 -m http.server 8000`; open [the site](http://localhost:8000/) and [browser checks](http://localhost:8000/tests/navigation.html). For `/portfolio/` paths, use `python3 -m http.server 8000 --directory ..`; open [subpath checks](http://localhost:8000/portfolio/tests/navigation.html) and [404](http://localhost:8000/portfolio/404.html). Python does not route missing URLs to the custom 404 page.
- Keep plain HTML/CSS/JavaScript, the 404 page and test fixture. Expect zero failures with normal/reduced motion; check both themes, desktop/mobile, keyboard navigation and print.
- Corrections to links, facts, accessibility and rendering are welcome. Include the browser, version and a screenshot for rendering issues.
