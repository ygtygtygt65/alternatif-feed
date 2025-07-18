// index.js
import express from 'express';
import cors from 'cors';
import { create } from 'xmlbuilder2';

import scrapeT24 from './sources/t24.js';
import scrapeArtigercek from './sources/artigercek.js';
import scrapeBianet from './sources/bianet.js';
import scrapeCumhuriyet from './sources/cumhuriyet.js';
import scrapeEvrensel from './sources/evrensel.js';
import scrapeSendika from './sources/sendika.js';
import scrapeDiken from './sources/diken.js';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

const feeds = [
  { path: '/t24', scraper: scrapeT24 },
  { path: '/artigercek', scraper: scrapeArtigercek },
  { path: '/bianet', scraper: scrapeBianet },
  { path: '/cumhuriyet', scraper: scrapeCumhuriyet },
  { path: '/evrensel', scraper: scrapeEvrensel },
  { path: '/sendika', scraper: scrapeSendika },
  { path: '/diken', scraper: scrapeDiken },
];

feeds.forEach(({ path, scraper }) => {
  app.get(path, async (req, res) => {
    try {
      const items = await scraper();

      const feedObj = {
        rss: {
          '@version': '2.0',
          channel: {
            title: `${path.slice(1)} Haberler`,
            link: `https://${path.slice(1)}.com`,
            description: `Alternatif GPT için özel RSS feed`,
            language: 'tr-TR',
            item: items.map(({ title, link, pubDate }) => ({
              title,
              link,
              description: '',
              pubDate,
            })),
          },
        },
      };

      const xml = create(feedObj).end({ prettyPrint: true });
      res.set('Content-Type', 'application/rss+xml');
      res.send(xml);
    } catch (error) {
      console.error(`Error scraping ${path}:`, error);
      res.status(500).send('Feed oluşturulurken hata oluştu.');
    }
  });
});

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});

