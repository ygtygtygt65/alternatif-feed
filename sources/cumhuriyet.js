// sources/cumhuriyet.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function scrapeCumhuriyet() {
  const url = 'https://www.cumhuriyet.com.tr/';
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];

  $('div[class*="swiper-slide"] a.card-title').each((i, el) => {
    const title = $(el).text().trim();
    const link = $(el).attr('href');
    const fullLink = link.startsWith('http') ? link : `https://www.cumhuriyet.com.tr${link}`;
    const pubDate = new Date().toUTCString();

    if (title && fullLink) {
      items.push({ title, link: fullLink, pubDate });
    }
  });

  return items;
}
