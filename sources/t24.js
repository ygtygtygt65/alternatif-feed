import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeT24() {
  const url = 'https://t24.com.tr';
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];

  $('a.hoverable').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    const link = href.startsWith('http') ? href : `${url}${href}`;

    if (title && link.includes('/haber/')) {
      items.push({
        title,
        link,
        pubDate: new Date().toUTCString(),
      });
    }
  });

  return {
    title: 'T24 Haberler',
    link: url,
    description: 'T24 RSS feed - Alternatif GPT',
    language: 'tr-TR',
    items,
  };
}

export default scrapeT24;

