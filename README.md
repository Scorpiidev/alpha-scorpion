# Antares · comics & illustration

Portfolio site, live at **https://scorpiidev.github.io/alpha-scorpion/**.
GitHub Pages rebuilds it by itself about a minute after every commit to `main`. Nothing to install, nothing to pay.

Most changes can be made straight on github.com: **Add file → Upload files** or the pencil icon on a file, then **Commit changes**.

## Add a comic

The reader shows comics as page images, so it opens instantly and there is no PDF to download.

1. On your computer, once: `pip install pymupdf pillow` (both free).
2. Run `python tools/comic_pages.py path/to/my-comic.pdf my-comic`.
   It writes `assets/comics/my-comic/01.webp, 02.webp, …` plus `cover.webp`, and splits
   pages exported 2-up into single pages. Keep the PDF on your computer, not in the repo.
3. Add a block to `_data/comics.yml` with the same `slug` and the page count the script printed.

Want a different cover? Replace `cover.webp` with your own image (about 1000 px wide).

## Add artwork to the gallery

1. Upload the image to `assets/works/` (lowercase, dashes, no spaces: `moth-queen.jpg`; at most ~2200 px on the long side).
2. Optional but faster: upload a ~760 px `.webp` copy with the same name to `assets/works/thumbs/`.
3. Create `_works/24-moth-queen.md`:

```markdown
---
title: "Moth Queen"
medium: digital painting
category: illustration        # illustration, characters or sketches
file: moth-queen.jpg
ratio: 0.75                   # optional: width ÷ height, stops the grid jumping while it loads
alt: "What is in the picture, for people who can't see it"
order: 24                     # position in the gallery
---
```

Phone photos can carry GPS location in their metadata; "export for web" strips it.

## Change other things

| What | Where |
| --- | --- |
| Intro, about text, tools | `index.html` |
| "Open for projects…" line | `availability` in `_config.yml` |
| Social links | `_data/socials.yml` |
| Contact page wording | `contact/index.html` |
| Colours & font | top of `assets/css/main.css` |

## Contact form

Messages go through [Web3Forms](https://web3forms.com) (free, 250 a month); your email address never appears on the site.
The key is `web3forms_access_key` in `_config.yml`. To require the captcha, pick **hCaptcha** as spam protection
in the Web3Forms dashboard.

## Preview on your computer (optional)

Needs Ruby: `bundle install`, then `bundle exec jekyll serve`, and open <http://localhost:4000/alpha-scorpion/>.
