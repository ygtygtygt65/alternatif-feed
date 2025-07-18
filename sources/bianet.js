// sources/bianet.js
import axios from 'axios';
import cheerio from 'cheerio';

const scrapeBianet = async () => {
  const { data } = await axios.get('https://bianet.org');
  const $ = cheerio.load(data);
  const items = [];

  $('.news-list-item').each((i, el) => {
    const title = $(el).find('a.title').text().trim();
    const link = $(el).find('a.title').attr('href');
    const pubDate = $(el).find('span.date').text().trim();

    if (title && link && pubDate) {
      items.push({
        title,
        link: link.startsWith('http') ? link : `https://bianet.org${link}`,
        pubDate: new Date(pubDate).toUTCString()
      });
    }
  });

  return items;
};

export default scrapeBianet;
