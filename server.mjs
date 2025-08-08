
import express from "express";
import cors from "cors";
import { XMLParser } from "fast-xml-parser";
import NodeCache from "node-cache";

const app = express();
const PORT = process.env.PORT || 3000;
const FEED_URLS = (process.env.FEED_URLS || "").split(";").map(s => s.trim()).filter(Boolean);
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 600);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const TITLE_FILTER = process.env.TITLE_FILTER || "";
const BASIC_USER = process.env.BASIC_USER;
const BASIC_PASS = process.env.BASIC_PASS;

if (!FEED_URLS.length) {
  console.warn("WARNING: FEED_URLS env is empty. Set at least one feed URL.");
}

app.use(cors({ origin: ALLOW_ORIGIN }));

// Optional basic auth
if (BASIC_USER && BASIC_PASS) {
  app.use((req, res, next) => {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");
    if (scheme !== "Basic" || !token) return res.set("WWW-Authenticate", "Basic").status(401).send("Auth required");
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [user, pass] = decoded.split(":");
    if (user === BASIC_USER && pass === BASIC_PASS) return next();
    return res.set("WWW-Authenticate", "Basic").status(401).send("Bad credentials");
  });
}

const cache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS, useClones: false });
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function toISODate(d) {
  try {
    const t = new Date(d);
    if (!isNaN(t)) return t.toISOString();
  } catch {}
  return null;
}

function normalizeDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Try to normalize one item into {title, link, published, source}
function normalizeItem(raw, sourceUrl) {
  // Common RSS fields
  let title = raw.title?.["#text"] || raw.title || "";
  let link = raw.link?.href || raw.link || raw.url || "";
  let pub =
    raw.pubDate ||
    raw.published ||
    raw.updated ||
    raw["dc:date"] ||
    raw.isoDate ||
    raw.date ||
    null;

  // For JSON shapes like RSS.app (guessing common fields)
  if (!title && raw?.content?.title) title = raw.content.title;
  if (!link && raw?.content?.link) link = raw.content.link;
  if (!pub && raw?.content?.pubDate) pub = raw.content.pubDate;

  const published = toISODate(pub) || new Date().toISOString();
  const source = normalizeDomain(link) || normalizeDomain(sourceUrl) || "unknown";

  return { title: String(title || "").trim(), link: String(link || "").trim(), published, source };
}

async function fetchOne(url) {
  const res = await fetch(url, { headers: { "User-Agent": "alternatif-rss-cache/1.0" } });
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const j = await res.json();
    // Try common JSON shapes: { items: [...] } or array
    const items = Array.isArray(j) ? j : (j.items || j.entries || j.data || j.results || []);
    return items.map(it => normalizeItem(it, url));
  } else {
    const txt = await res.text();
    const data = parser.parse(txt);
    // Try RSS 2.0
    if (data?.rss?.channel?.item) {
      const arr = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
      return arr.map(it => normalizeItem(it, url));
    }
    // Try Atom
    if (data?.feed?.entry) {
      const arr = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
      return arr.map(it => normalizeItem(it, url));
    }
    // Fallback: empty
    return [];
  }
}

async function refreshAll() {
  if (!FEED_URLS.length) return [];
  const key = "merged";
  const now = Date.now();

  const hitting = cache.getTtl(key);
  // If cached and not expired, return cached
  const cached = cache.get(key);
  if (cached) return cached;

  // Else refetch
  const results = await Promise.allSettled(FEED_URLS.map(fetchOne));
  let items = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) items = items.concat(r.value);
  }

  // title filtering
  if (TITLE_FILTER) {
    const rx = new RegExp(TITLE_FILTER, "i");
    items = items.filter(it => rx.test(it.title || ""));
  }

  // Sort by published desc
  items.sort((a, b) => new Date(b.published) - new Date(a.published));

  const payload = {
    meta: {
      sources: FEED_URLS,
      generatedAt: new Date().toISOString(),
      totalItems: items.length
    },
    items
  };
  cache.set(key, payload, CACHE_TTL_SECONDS);
  return payload;
}

// Background refresher: refresh on interval so first request is warm after cold start
setInterval(async () => {
  try { await refreshAll(); } catch (e) { console.error("Background refresh error", e); }
}, Math.max(CACHE_TTL_SECONDS * 1000, 30_000));

app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get("/feed", async (req, res) => {
  try {
    let data = await refreshAll();
    const limit = Number(req.query.limit || 0);
    if (limit > 0) {
      data = { ...data, items: data.items.slice(0, limit) };
    }
    res.set("Cache-Control", "public, max-age=30"); // client-side hint
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed_to_fetch" });
  }
});

app.get("/", (req, res) => res.type("text").send("Alternatif RSS Cache Server. Try /feed or /health."));

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log("Sources:", FEED_URLS.length ? FEED_URLS.join(", ") : "(none)");
});
