# Plain-letter delivery test

Brevo template: **Little memoirs - plain letter**, ID 9.
Test recipients: **Little memoirs - test only**, list ID 5, containing only the owner's address.
Test feed: https://petrarkar.github.io/newsletter/test-feed.xml

The template reads full article HTML using `item.CONTENT_ENCODED | safe`, inside
`params.items`. It has no banner, images, web fonts or read-more button, and retains
the unsubscribe link. Source: `docs/email/plain-letter.html` (excluded from Jekyll).
Brevo's preview endpoint rendered the real test issue successfully without sending.

In Brevo, create a separate RSS Campaign integration for this test. Load the test
feed, select the named template under My email templates, choose list 5, and use
sender Pepi / petar35r@gmail.com. Set the campaign subject to **A little letter from
Pepi**: the integration's subject can override the template's subject.
Choose automatic sending and a check at least one hour after publication and
integration creation, using Europe/Belgrade time. Disable the test integration
once the message arrives. Keep the production feed and list 4 separate.

The issue has `delivery_test: true` and `newsletter: false`. It is public on the
web, but excluded from the production feed and newsletter archive. Future test
issues need a new permalink/GUID and publication date; don't change a previously
sent issue's GUID merely to resend it.

A different Gmail tab is not guaranteed. If the reader already moved a previous
message to Primary, that preference affects the result. A scheduled RSS send
checks the real pipeline; a manual transactional test does not.
