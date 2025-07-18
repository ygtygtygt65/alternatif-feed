import axios from 'axios';
import cheerio from 'cheerio';

export default async function scrapeArtigercek() {
  const url = 'https://artigercek.com';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const items = [];

  $('a.card-title').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    const link = href.startsWith('http') ? href : `${url}${href}`;
    const pubDate = new Date().toUTCString();

    if (title && link) {
      items.push({ title, link, pubDate });
    }
  });

  return {
    title: 'Artı Gerçek Haberler',
    link: url,
    description: 'Alternatif GPT için özel RSS feed (Artı Gerçek)',
    language: 'tr-TR',
    items,
  };
}
