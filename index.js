import express from 'express';
import cors from 'cors';
import scrapeT24 from './sources/t24.js';
import scrapeArtigercek from './sources/artigercek.js'; // ✅ Artı Gerçek eklendi

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

const feeds = [
  { path: '/t24', scraper: scrapeT24 },
  { path: '/artigercek', scraper: scrapeArtigercek }, // ✅ Artı Gerçek feed tanımı
];

feeds.forEach(({ path, scraper }) => {
  app.get(path, async (req, res) => {
    try {
      const feed = await scraper();
      const xml = buildRssXml(feed);
      res.set('Content-Type', 'application/rss+xml');
      res.send(xml);
    } catch (err) {
      console.error(`Hata (${path}):`, err.message);
      res.status(500).send('RSS feed oluşturulamadı.');
    }
  });
});

function buildRssXml(feed) {
  return `
    <?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <title>${feed.title}</title>
        <link>${feed.link}</link>
        <description>${feed.description}</description>
        <language>${feed.language}</language>
        ${feed.items
          .map(
            (item) => `
          <item>
            <title>${item.title}</title>
            <link>${item.link}</link>
            <description>${item.description || ''}</description>
            <pubDate>${item.pubDate}</pubDate>
          </item>
        `
          )
          .join('')}
      </channel>
    </rss>
  `.trim();
}

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});
