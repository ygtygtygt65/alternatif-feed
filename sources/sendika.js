import axios from 'axios';
import cheerio from 'cheerio';

export default async function scrapeSendika() {
  const url = 'https://sendika.org/kategori/haberler/';
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const items = [];

  $('.td_module_10').slice(0, 5).each((_, el) => {
    const title = $(el).find('.entry-title a').text().trim();
    const link = $(el).find('.entry-title a').attr('href');
    const pubDate = new Date().toUTCString();

    if (title && link) {
      items.push({ title, link, pubDate });
    }
  });

  return {
    title: 'Sendika.org Haberler',
    link: 'https://sendika.org',
    description: 'Alternatif GPT için özel RSS feed (Sendika.org)',
    language: 'tr-TR',
    items,
  };
}
