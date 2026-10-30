# flickbar.github.io

The website for [Flickbar](https://github.com/flickbar/flickbar), served by GitHub Pages at
<https://flickbar.github.io/>, in English, French (`/fr/`) and Persian (`/fa/`, right to left).

The pages are built from one template:

- `src/page.html`: the page, with a `{{key}}` for every piece of text
- `src/strings/en.json`, `fr.json`, `fa.json`: the text in each language, including the demo's captions
- `site.css`, `site.js`: shared by all pages

After changing any of these, run:

```sh
python3 build.py
```

It writes `index.html`, `fr/index.html` and `fa/index.html`, and refuses if a language is missing a string,
or if the Persian uses Arabic-only letters, hamza or diacritics, or starts a paragraph with a Latin word
(which would lay it out left to right).

Screenshots in `img/` are per language (`*-en.webp`, `*-fr.webp`, `*-fa.webp`), taken from the app running
in that language. `appcast.xml` is Flickbar's update feed, written by the app's `scripts/release.sh`.
