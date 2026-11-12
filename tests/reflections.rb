# Render real Jekyll templates into a disposable destination; never publish fixtures.
require 'jekyll'
require 'nokogiri'
require 'tmpdir'

fixture_post = nil
fixture_date = nil
Jekyll::Hooks.register :site, :post_read do |site|
  post = site.posts.docs.reject { |entry| entry.data['discovery_hidden'] }.max_by(&:date)
  fixture_post = post
  fixture_date = post&.date&.iso8601
  raise 'Missing fixture target' unless post
  post.data['reflections'] = [
    {'date' => '2026-11-14', 'title' => 'Later note', 'now' => '**Changed** my mind.'},
    {'date' => '2026-11-13', 'title' => 'First note', 'then' => 'A past belief.', 'now' => 'A new thought.'}
  ]
  post.data['experiment'] = 'sampling'
end

Dir.mktmpdir('blog-reflections-') do |destination|
  config = Jekyll.configuration('destination' => destination, 'quiet' => true)
  site = Jekyll::Site.new(config)
  site.process
  html = Nokogiri::HTML(File.read(fixture_post.destination(destination)))
  notes = html.css('.reflection')
  raise 'Reflections not rendered in date order' unless notes.css('h3').map(&:text) == ['First note', 'Later note']
  raise 'Markdown was not rendered' unless notes.last.at_css('strong')&.text == 'Changed'
  raise 'Then field missing' unless notes.first.at_css('.reflection-then')&.text&.include?('A past belief.')
  raise 'Note date missing' unless notes.first.at_css('time')['datetime'] == '2026-11-13'
  raise 'Original entry date overwritten' unless html.at_css('.post-meta time')['datetime'] == fixture_date
  raise 'Experiment not embeddable in posts' unless html.css('[data-sampling]').length == 1
  home = Nokogiri::HTML(File.read(File.join(destination, 'index.html')))
  raise 'Revisited marker missing' unless home.at_css('.reflection-marker')
  other = site.posts.docs.find { |post| post != fixture_post && !post.data['reflections'] }
  unchanged = Nokogiri::HTML(File.read(other.destination(destination)))
  raise 'Empty reflection state missing' unless unchanged.at_css('.reflections').text.include?('No later note yet.')
end
puts 'Reflection checks passed: chronological notes, Markdown, original date, empty state, homepage marker, embedded experiment.'
