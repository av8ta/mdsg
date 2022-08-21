# mdsg - MarkDown Site Generator

Generates html from markdown using [remark](https://github.com/remarkjs) and [rehype](https://github.com/rehypejs) plugins from the `unifiedjs` ecosystem.

# installation

```sh
npm i -g mdsg
```

# usage

Convert `*.md` files in current directory to html and write to `./output/`

```sh
mdsg
```

To specify input and output directories:

```sh
mdsg <inputDir> <outputDir?>
```

If only an input directory is specified, output will be written to `<inputDir>/output/`

## print usage

```sh
mdsg --help
```

# config

`mdsg` uses [`rc`](https://github.com/dominictarr/rc#standards) so you can set config in all the places `rc` looks.

Example config

```json
{
  "assets": "./assets",
  "css": [
    "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/github-dark.min.css",
    "/assets/css/fonts.css",
    "/assets/css/styles.css",
    "/assets/css/theme.css"
  ],
  "injectCss": false
}
```

## css

### *css links in head*

The css array from config is used when linking to css files in the head tag of each html document. This is the default setting. A `<link rel="stylesheet" href="/...">` tag is injected for each item in the array.

### *css style tags in head*

To inject the css as style tags into each document:

```sh
mdsg --injectCss true
```

When injecting, the css is loaded from `**/*.css` files in the assets directory. They're lexicographically sorted by filename before being written into style tags in the head tag of each document.

## assets

The assets directory contents are copied to the output directory.

## skipping content

Directories or files with a leading underscore are skipped when reading content.

e.g. naming your output directory to `_site/` would ensure it's skipped on a subsequent run.
 