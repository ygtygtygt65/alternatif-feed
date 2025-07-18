import Parser from 'rss-parser';
import { create } from 'xmlbuilder2';

const parser = new Parser();

export async function getT24Feed() {
  const feed = await parser.parseURL('https://t24.com.tr/rss');
  const items = feed.items.slice(0, 5);

  const rss = create({ version: '1.0' })
    .ele('rss', { version: '2.0' })
    .ele('channel')
      .ele('title').txt('T24 Haberler').up()
      .ele('link').txt('https://t24.com.tr').up()
      .ele('description').txt('T24 RSS feed - Alternatif GPT').up()
      .ele('language').txt('tr-TR').up();

  items.forEach(item => {
    rss.ele('item')
      .ele('title').txt(item.title).up()
      .ele('link').txt(item.link).up()
      .ele('description').txt(item.contentSnippet || '').up()
      .ele('pubDate').txt(item.pubDate || '').up()
    .up();
  });

  return rss.end({ prettyPrint: true });
}
