
# Blog

This is the readme file of my blog, made by using Chirpy's jekyll theme, I plan to update it as I go along and make modifications through trial and error


## License

This work is published under [MIT][mit] License.

[gem]: https://rubygems.org/gems/jekyll-theme-chirpy
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[CD]: https://en.wikipedia.org/wiki/Continuous_deployment
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE

## The little corners of the blog

The site uses Jekyll with a custom responsive neon layout. All edits are ordinary
files: commit and push to `main` to publish through GitHub Pages.

- **Currently:** edit `_data/currently.yml`. Fill in `text` and optionally `url`;
  set `updated: 2026-11-12` (use the actual update date). Blank fields display
  “Nothing pinned yet.” Dates are not refreshed automatically.
- **Trails:** edit `_data/trails.yml`. Each `posts` list contains exact titles of
  published posts, in reading order. Draft posts are never included.
- **Shelf:** edit `_data/shelf.yml`. Add an item with `category` (`books`, `papers`,
  `music`, or `objects`), `title`, `creator`, and your `note`. Link to an existing
  post using `post_title`, or to something else with `url`.
- **Time machine:** automatically chooses a published entry older than the
  current post. On other pages it skips the newest entry. With JavaScript off,
  or from the oldest entry, it opens the archive.
- **Then / now:** add `reflections` inside an old post’s YAML front matter:

  ```yaml
  reflections:
    - date: 2026-11-12
      title: A little distance
      then: |
        Write what you believed then, or quote a passage from the original.
      now: |
        Write your own reflection here. **Markdown works.**
  ```

  Add another dated item whenever you revisit it. Notes appear after the original
  writing, sorted by date; the original post date and prose stay intact. The
  homepage marks posts with reflections. Without notes, the section says there
  is no later note yet. No fictional reflections have been added.
- **Signal experiment:** lives at `/playground/`. Add `experiment: sampling` to
  any post’s front matter to embed it after the article. Or include
  `{% include sampling.html %}` within a post. Multiple embeds
  work independently. The sliders use JavaScript; the explanation remains
  readable without it.

`discovery_hidden: true` keeps a post URL available while omitting it from the
homepage, archive, trails, and time machine. The old duplicate `/posts/Blur/`
uses this flag; its URL is preserved.

### Local checks

Use Ruby 3.3 (the same version as CI) and Node 20+:

```sh
bundle install
bundle exec jekyll build
node --test tests/*.test.mjs
bundle exec ruby tests/reflections.rb
bundle exec htmlproofer _site --disable-external
bundle exec jekyll serve
```

The browser smoke test needs Playwright and Chromium. See `tests/browser.cjs` for
its environment variables. It checks routes, responsive overflow, random navigation,
slider behavior, keyboard operation, and no-JavaScript fallbacks.
