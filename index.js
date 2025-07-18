import express from 'express';
import cors from 'cors';
import { getArtigercekFeed } from './sources/artigercek.js';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('✅ Alternatif Feed sunucusu çalışıyor');
});

app.get('/rss/artigercek', async (req, res) => {
  try {
    const xml = await getArtigercekFeed();
    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  } catch (err) {
    console.error('Feed üretim hatası:', err);
    res.status(500).send('Artigercek feed üretilemedi');
  }
});

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});
