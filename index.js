import express from 'express';
import cors from 'cors';
import { getArtigercekFeed } from './sources/artigercek.js';
import { getT24Feed } from './sources/t24.js'; // ✅ T24 eklendi

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
    console.error('Artigercek feed hatası:', err);
    res.status(500).send('Artigercek feed üretilemedi');
  }
});

app.get('/rss/t24', async (req, res) => {
  try {
    const xml = await getT24Feed();
    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  } catch (err) {
    console.error('T24 feed hatası:', err);
    res.status(500).send('T24 feed üretilemedi');
  }
});

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});
