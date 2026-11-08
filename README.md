# flickbar.github.io

The website for [Flickbar](https://github.com/flickbar/flickbar), served by GitHub Pages at
<https://flickbar.parsakp.com/>, in English, French (`/fr/`), Spanish (`/es/`), Persian (`/fa/`, right to left), and Simplified (`/zh-hans/`) and
Traditional (`/zh-hant/`) Chinese.

The pages are built from one template:

- `src/page.html`: the page, with a `{{key}}` for every piece of text
- `src/strings/<language>.json` (`en`, `fr`, `es`, `fa`, `zh-Hans`, `zh-Hant`): the text in each language, including
  the demo's captions. Use the same names for settings and buttons as the app's own translation
  (`Resources/Localizable.xcstrings` in the Flickbar repo).
- `site.css`, `site.js`: shared by all pages

After changing any of these, run:

```sh
python3 build.py
```

It writes a page per language, plus `sitemap.xml` and `sitemap.txt` and every page's `hreflang` links (all from the
`LANGS` list in `build.py`; add a language there), and refuses if a language is missing a string,
or if the Persian uses Arabic-only letters, hamza or diacritics, or starts a paragraph with a Latin word
(which would lay it out left to right).

Screenshots in `img/` are per language (`settings-gestures-`, `settings-general-` and `tutorial-` plus the
language code, `.webp`), taken from the installed app running in that language: launch it with
`open -n /Applications/Flickbar.app --args -AppleLanguages "(es)"` (the argument isn't saved), open the window,
and capture it with `screencapture -l <window id>`. Add `--practice` for the tutorial window. Sizes are set in
`src/page.html`, so change them there if a window's size changes. `appcast.xml` is Flickbar's update feed, written by the app's `scripts/release.sh`.
