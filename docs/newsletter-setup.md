# Newsletter setup

Stack: the existing Jekyll blog on free GitHub Pages. No extra framework or server.
The journal stays at `/`; the newsletter landing page is `/newsletter/`.
The existing Atom feed at `/feed.xml` stays intact. Use the dedicated
RSS 2.0 feed at `/newsletter/feed.xml` for email.

## Files and placeholders

```
_data/newsletter.yml             name, topic, frequency, signup_enabled, provider
_includes/newsletter-form.html   replace with the complete ESP HTML embed
_issues/sample.md                example only, excluded from the email feed
_layouts/newsletter-issue.html   web reading layout
newsletter/index.html           landing page
newsletter/archive.html         past issues
newsletter/feed.xml             RSS template
assets/css/newsletter.css        scoped form and reading styles
```

Current name: `Little memoirs` (from the owner’s Brevo form). Other defaults: the electronics/building/learning topic and
`Occasional notes`. Change these in `_data/newsletter.yml`. Set the real sending
schedule in the ESP. Keep `_config.yml` URL `https://petrarkar.github.io`, baseurl empty.
For another account use `https://USERNAME.github.io` and a public repository
named `USERNAME.github.io`.

## Free provider choice

Checked 2026-11-12:
- [Buttondown](https://buttondown.com/pricing): first 100 subscribers free,
  but RSS-to-email costs $9/month extra.
- [MailerLite](https://www.mailerlite.com/help/how-to-create-an-rss-campaign):
  RSS campaigns require a paid plan.
- Recommended: Brevo Free with RSS Campaign integration.
  [Free plan limits](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans):
  300 sends/day. Keep the audience below this, allowing for confirmation emails
  and other sends. Do not assume larger campaigns automatically roll over.
  Sending requires account approval. Confirm RSS Campaign is available on your
  permanent Free plan, rather than a trial, before activating.

GitHub Pages publishes the feed; it cannot send email. The signup form is connected to the owner-provided Brevo hosted form. The local
setup record is outside the repository at `~/.config/brevo/newsletter-setup.json`.
The newsletter list was created as `Hopefully a newsletter` (ID 4); the active
sender is configured in Brevo. No emails have been sent by this code. The form's
list association and double opt-in must be verified with an actual confirmed
subscription; RSS Campaign activation is still pending in the dashboard.

## Connect signup

1. Create a free Brevo account, verify your sender, and create a newsletter list.
   You cannot add email DNS records to `github.io`; without your own domain,
   follow the ESP's supported verified-sender setup. This site needs no domain purchase.
2. Create an embedded subscription form for that list. Enable double opt-in.
   Configure confirmation/success messages and your privacy notice in the ESP.
3. Replace `_includes/newsletter-form.html` with the complete HTML embed.
   Keep its form action, email field name, hidden IDs, anti-bot fields and scripts.
   These are generated for your account. Never paste API keys into this repository.
4. Set `provider: Brevo` and `signup_enabled: true` in `_data/newsletter.yml`.
5. `.newsletter-embed` scopes the local form CSS. If the embed uses inline colors
   or fixed widths, change those in its designer. Parent CSS cannot style an iframe.
6. Subscribe with your own address, confirm, check list membership, then unsubscribe.

Buttondown or MailerLite HTML embeds can go in the same include. Buttondown's form
URL contains your username; MailerLite uses generated account/form IDs and may need
its universal script. Preserve all provider field names. Their free signup works,
but native RSS automation does not meet the budget.

## RSS automation

Follow [Brevo's RSS Campaign guide](https://help.brevo.com/hc/en-us/articles/360013130059-RSS-Campaign-integration-Automatically-share-your-blog-posts-with-your-subscribers).

1. After deployment open Integrations, choose RSS Campaign and create an integration.
2. Load `https://petrarkar.github.io/newsletter/feed.xml`.
   Initially valid but empty: the sample is excluded. Publish a real issue to test.
3. Choose RSS Default Template. The feed has a description and full HTML in
   `content:encoded`. Preview the template; select full content if supported or
   an excerpt with the issue link. Website CSS does not carry into email.
4. Select your list, verified sender, reply-to and subject. Keep unsubscribe/footer.
5. First use draft/manual creation with a test list containing only your address.
   Check which existing entries it includes on the first run.
6. After testing, choose the actual list, weekly schedule/timezone and automatic
   sending, then activate.

This is scheduled polling, not instant sending on Git push. Brevo documents
publishing at least an hour before the check, sending only for new content, and
at most 10 articles per campaign. A weekly schedule creates a digest.

## Write an issue

Copy `_issues/sample.md` to `_issues/2026-11-19-first-letter.md`.
Set title, description and actual date; `sample: false`; `newsletter: true`;
permalink `/newsletter/issues/first-letter/`. Replace the sample body.
Keep the permalink stable: it is the RSS GUID. Editing an old issue is not a
reliable way to send a correction.

Use absolute links and image URLs, for example
`[the lab]({{ '/lab/' | absolute_url }})`. Link to interactive demos rather than
embedding scripts in email.

Only opted-in, non-sample issues dated at/before build time enter the feed/archive.
Future dates do not trigger a rebuild automatically: push or manually run the
workflow when publishing. `newsletter: false` excludes email, not the public web
page; keep private drafts outside the collection.

## Deploy

GitHub repository Settings, Pages: Source **GitHub Actions**.
The existing `.github/workflows/pages-deploy.yml` builds and publishes Jekyll.
No ESP API secret or additional sending workflow is needed.

From this checkout, with Ruby 3.3:

```sh
bundle install
bundle exec jekyll build
bundle exec ruby tests/newsletter.rb
bundle exec htmlproofer _site --disable-external
git add _config.yml _data/newsletter.yml _includes/newsletter-form.html _issues _layouts/newsletter-issue.html newsletter assets/css/newsletter.css index.html docs/newsletter-setup.md tests/newsletter.rb .github/workflows/pages-deploy.yml
git commit -m "Add newsletter pages, signup integration and RSS feed"
git push origin main
```

For a fresh machine first clone the existing repository:

```sh
git clone https://github.com/USERNAME/USERNAME.github.io.git
cd USERNAME.github.io
```

Wait for Build and Deploy in Actions. Check the landing page, archive and feed,
then the ESP preview. Account setup and a confirmed test subscription remain
necessary before the newsletter can collect subscribers and send automatically.
