// sources/evrensel.js
import axios from 'axios';
import * as cheerio from 'cheerio';


const scrapeEvrensel = async () => {
  const { data } = await axios.get('https://www.evrensel.net/');
  const $ = cheerio.load(data);
  const items = [];

  $('.news-content').each((i, el) => {
    const title = $(el).find('a').first().text().trim();
    const link = $(el).find('a').first().attr('href');
    const pubDate = $(el).find('.date').text().trim();

    if (title && link && pubDate) {
      items.push({
        title,
        link: link.startsWith('http') ? link : `https://www.evrensel.net${link}`,
        pubDate: new Date(pubDate).toUTCString()
      });
    }
  });

  return items;
};

export default scrapeEvrensel;
