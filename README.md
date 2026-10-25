# ✶ Antares · cabinet of curiosities

*Per Tenebras, Forma.* Portfolio, field log and museum of oddities of Antares (Antares).

Live at **https://scorpiidev.github.io/alpha-scorpion/** once this branch is merged into the branch
GitHub Pages publishes from (usually `main`, see *Settings → Pages*). GitHub builds the site by
itself every time you commit: no installs, no servers, no cost.

Everything below can be done from the GitHub website: **Add file → Create new file** or
**Add file → Upload files**, then **Commit changes**. Wait about a minute and refresh the site.

---

## 0 · One-time setup: the contact form

The form on `/transmit/` sends messages straight to your inbox through
[Web3Forms](https://web3forms.com) (free, 250 messages a month). Your email address never
appears anywhere in this repository or on the site.

1. Go to <https://web3forms.com>, type your email and click **Create Access Key**. They email you the key.
2. Open `_config.yml`, find `web3forms_access_key: ""` and paste the key between the quotes. Commit.
3. Turn on the captcha: log in to the Web3Forms dashboard, open your form's settings and choose
   **hCaptcha** as the spam protection. The site already shows the captcha (it's free on their plan);
   this step makes Web3Forms *require* it.

Until step 2 is done the form shows "transmitter offline" instead of sending.

---

## 1 · Write a blog post (the Field Log)

1. Go to the `_posts` folder → **Add file → Create new file**.
2. Name it `YEAR-MONTH-DAY-short-name.md`, for example `2026-11-02-ink-tests.md`.
3. Paste this at the top, then write underneath:

```markdown
---
title: "Ink tests"
tags: [process, comics]      # optional
cover: ink-tests-cover.jpg   # optional, see images below
---

Write here. **Bold**, *italic*, [links](https://example.com), lists, quotes with >.
```

**Images in a post:** upload them to `assets/posts/` first (**Add file → Upload files**), then:

```markdown
![what is in the picture](/assets/posts/my-image.jpg)

{% include figure.html file="my-image.jpg" caption="fig. 1 · a pinned figure with a caption" %}
```

Links to your own pages start with `/`, e.g. `[my hall](/specimens/)`. The site fixes them up for you.
Writing in Spanish? Add `lang: es` under the title. There's a ready template in `_drafts/TEMPLATE-new-post.md`
(files in `_drafts` are never published).

---

## 2 · Add artwork (the Hall of Specimens)

**The lazy way (10 seconds):** upload an image into `assets/works/`. It appears in the hall straight away
as an *uncatalogued* specimen, titled after its file name.

**The proper way:** upload the image to `assets/works/`, then create a label for it in `_works/`,
e.g. `_works/moth-queen.md`:

```markdown
---
title: "Moth Queen"
date: 2026-11-02            # used for ordering and the catalogue number
year: "2026"                # what the placard shows (optional, free text)
medium: digital painting
tools: [Krita]              # optional
tags: [illustration, character]
file: moth-queen.jpg        # the image you uploaded to assets/works/
featured: true              # optional: show it on the home page shelf
---

The description. As long or short as you like.
```

It gets its own page at `/specimens/moth-queen/`, a slot in the inspection chamber and a catalogue number.

**The vault:** a `_works` file with an empty `file:` shows up as an index card in *The Vault*
("catalogued, not yet digitized"). When you have the image, upload it and fill in `file:`, and it moves into the hall.

**Image tips:** export at most ~2200 px on the long side, JPG quality ~80. Keep file names lowercase with
dashes, no spaces (`moth-queen.jpg`). Phone photos can carry GPS location in their metadata; export or
"save for web" to strip it before uploading.

---

## 3 · Change other things

| What | Where |
| --- | --- |
| Social links | `_data/socials.yml` |
| Hidden oddities (names, hints, notes) | `_data/oddities.yml` |
| Home page intro text | `index.html` (section I) |
| About text, tools, "open to" list | `curator/index.html` |
| Contact page wording | `transmit/index.html` |
| Image credits | `colophon/index.html` |
| Colours & fonts | top of `assets/css/main.css` |

The desk collage on the home page is in `index.html` (section II). Each piece has `--x`, `--y`
(position in % of the desk), `--w` (width) and `--r` (rotation).

---

## 4 · Map of the cabinet

```
_config.yml          site settings + contact form key
_posts/              field log entries (blog)
_works/              specimen labels (gallery)
_data/               socials, rooms of the star chart, oddities
_layouts/ _includes/ page templates
assets/works/        artwork images      ← drop images here
assets/posts/        blog images         ← and here
assets/img/          logo, palette, public-domain archive images
assets/css/main.css  all the styling
assets/js/           cursor, desk, terminal, synthesizer, lightbox, form
```

## 5 · Preview on your own computer (optional)

Needs Ruby. `bundle install`, then `bundle exec jekyll serve` and open <http://localhost:4000/alpha-scorpion/>.

## Secrets for visitors

Seven oddities are hidden across the rooms. Type `antares` anywhere. Talk to the terminal on the desk.
