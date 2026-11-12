require 'jekyll'
require 'nokogiri'
require 'tmpdir'
require 'time'

# Inject issues in memory; test letters are never written into the published site.
Jekyll::Hooks.register :site, :post_read do |site|
  collection = site.collections.fetch('issues')
  collection.docs.clear # Isolate fixtures from real issues added in the future.
  [
    ['included', true, false, Time.now - 3600],
    ['sample-test', true, true, Time.now - 3600],
    ['excluded', false, false, Time.now - 3600],
    ['future-test', true, false, Time.now + 86400]
  ].each do |name, opted_in, sample, date|
    doc = Jekyll::Document.new(File.join(site.source, '_issues', "#{name}.md"), site: site, collection: collection)
    doc.data.merge!('title' => 'Bits & bytes <notes>', 'date' => date,
      'newsletter' => opted_in, 'sample' => sample, 'description' => 'A & B',
      'layout' => 'newsletter-issue', 'permalink' => "/newsletter/issues/#{name}/")
    doc.content = "**Full content** with & and ]]> characters. [Lab]({{ '/lab/' | absolute_url }})"
    collection.docs << doc
  end
end

Dir.mktmpdir('newsletter-test-') do |destination|
  site = Jekyll::Site.new(Jekyll.configuration('destination' => destination, 'quiet' => true))
  site.process
  xml = Nokogiri::XML(File.read(File.join(destination, 'newsletter/feed.xml'))) { |cfg| cfg.strict }
  items = xml.xpath('/rss/channel/item')
  raise 'Sample, future or non-opted-in issue leaked into RSS' unless items.length == 1
  item = items.first
  raise 'Escaped title failed' unless item.at_xpath('title').text == 'Bits & bytes <notes>'
  raise 'GUID is not stable URL' unless item.at_xpath('guid').text == 'https://petrarkar.github.io/newsletter/issues/included/'
  Time.rfc2822(item.at_xpath('pubDate').text)
  content = item.at_xpath('content:encoded', 'content' => 'http://purl.org/rss/1.0/modules/content/').text
  raise 'Missing rendered full content' unless content.include?('<strong>Full content</strong>')
  raise 'Email link not absolute' unless content.include?('https://petrarkar.github.io/lab/')
  archive = File.read(File.join(destination, 'newsletter/archive/index.html'))
  raise 'Included issue missing from archive' unless archive.include?('/newsletter/issues/included/')
  raise 'Future issue leaked into archive' if archive.include?('/newsletter/issues/future-test/')
  home = Nokogiri::HTML(File.read(File.join(destination, 'newsletter/index.html')))
  if site.data['newsletter']['signup_enabled']
    form = home.at_css('#sib-form')
    raise 'Missing Brevo form' unless form && form['method'].upcase == 'POST'
    raise 'Form must submit directly to Brevo' unless form['action'].start_with?('https://2292a8c2.sibforms.com/serve/')
    raise 'Missing email input' unless form.at_css('input[name="EMAIL"][type="email"][required]')
    raise 'Missing provider anti-bot field' unless form.at_css('input[name="email_address_check"][tabindex="-1"]')
    raise 'Missing locale' unless form.at_css('input[name="locale"][value="en"]')
  else
    raise 'Unconfigured signup should not accept addresses' unless home.css('form').empty?
  end
  raise 'Existing journal feed missing' unless File.exist?(File.join(destination, 'feed.xml'))
end
puts 'Newsletter checks passed: strict RSS, escaped HTML, absolute links, stable GUID, dates and publication filters.'
