import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function scrapeDiken() {
  const url = 'https://www.diken.com.tr';
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];

  $('.td-big-grid-post .td-module-thumb a').each((i, el) => {
    const title = $(el).attr('title')?.trim();
    const link = $(el).attr('href');
    const pubDate = new Date().toUTCString(); // Tahmini tarih

    if (title && link) {
      items.push({ title, link, pubDate });
    }
  });

  return items;
}

