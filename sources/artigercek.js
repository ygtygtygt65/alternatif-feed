import axios from 'axios';
import * as cheerio from 'cheerio';
import { create } from 'xmlbuilder2';

export async function getArtigercekFeed() {
  const siteURL = 'https://artigercek.com';
  const { data } = await axios.get(siteURL);
  const $ = cheerio.load(data);

  const items = [];

  $('.newsItem').slice(0, 5).each((i, el) => {
    const title = $(el).find('h3').text().trim();
    const relativeLink = $(el).find('a').attr('href');
    const link = relativeLink.startsWith('http') ? relativeLink : siteURL + relativeLink;
    const description = $(el).find('p').text().trim();
    const pubDate = new Date().toUTCString();

    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  });

  const rss = create({ version: '1.0' })
    .ele('rss', { version: '2.0' })
    .ele('channel')
      .ele('title').txt('Artı Gerçek Haberler').up()
      .ele('link').txt(siteURL).up()
      .ele('description').txt('Alternatif GPT için özel RSS feed').up()
      .ele('language').txt('tr-TR').up();

  items.forEach(item => {
    rss.ele('item')
      .ele('title').txt(item.title).up()
      .ele('link').txt(item.link).up()
      .ele('description').txt(item.description || '').up()
      .ele('pubDate').txt(item.pubDate).up()
    .up();
  });

  return rss.end({ prettyPrint: true });
}

