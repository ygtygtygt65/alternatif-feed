import express from 'express';
import cors from 'cors';
import { create } from 'xmlbuilder2';

import scrapeArtigercek from './sources/artigercek.js';
import scrapeT24 from './sources/t24.js';

const app = express();
const port = process.env.PORT || 10000;
app.use(cors());

const feeds = [
  { path: '/artigercek', scraper: scrapeArtigercek },
  { path: '/t24', scraper: scrapeT24 },
];

for (const feed of feeds) {
  app.get(feed.path, async (req, res) => {
    try {
      const data = await feed.scraper();
      const feedObj = {
        rss: {
          '@version': '2.0',
          channel: {
            title: data.title,
            link: data.link,
            description: data.description,
            language: data.language,
            item: data.items,
          },
        },
      };

      const xml = create(feedObj).end({ prettyPrint: true });
      res.type('application/xml').send(xml);
    } catch (err) {
      console.error(err);
      res.status(500).send('Hata oluştu');
    }
  });
}

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});
