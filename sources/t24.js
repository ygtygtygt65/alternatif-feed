import axios from 'axios';
import * as cheerio from 'cheerio';
import { create } from 'xmlbuilder2';

export async function getT24Feed() {
  const siteURL = 'https://t24.com.tr';
  const { data } = await axios.get(siteURL);
  const $ = cheerio.load(data);

  const items = [];

  $('.widget-news-list .widget-news-list__item').slice(0, 5).each((i, el) => {
    const title = $(el).find('.widget-news-list__header a').text().trim();
    const relativeLink = $(el).find('.widget-news-list__header a').attr('href');
    const link = relativeLink?.startsWith('http') ? relativeLink : siteURL + relativeLink;
    const description = $(el).find('.widget-news-list__spot').text().trim();
    const pubDate = new Date().toUTCString();

    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  });

  const rss = create({ version: '1.0' })
    .ele('rss', { version: '2.0' })
    .ele('channel')
      .ele('title').txt('T24 Haberler').up()
      .ele('link').txt(siteURL).up()
      .ele('description').txt('Alternatif GPT için özel RSS feed (T24)').up()
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

  });

  return rss.end({ prettyPrint: true });
}
