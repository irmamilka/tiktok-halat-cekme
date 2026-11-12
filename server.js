// TikTok LIVE Halat Çekme - sunucu
// TikTok yayınına bağlanır, yorum/beğeni/hediye olaylarını overlay sayfasına iletir.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const args = process.argv.slice(2);
const DEMO = args.includes('--demo') || process.env.DEMO === '1';
const cliUser = args.find(a => !a.startsWith('--'));
const clean = u => String(u || '').replace(/^@/, '').trim();
let username = clean(cliUser || process.env.TIKTOK_KULLANICI || config.tiktokKullaniciAdi);
if (username === 'kullanici_adin_buraya') username = '';
const PORT = Number(process.env.PORT || config.port || 8080);
const PANEL_SIFRE = process.env.PANEL_SIFRE || config.panelSifre || '';
const EULER_KEY = process.env.EULER_API_KEY || config.eulerApiKey || '';

// ---------- HTTP (sayfaları sunar) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  if (url === '/panel') url = '/panel.html';
  if (url === '/health') { res.writeHead(200); return res.end('ok'); }
  if (url === '/config') {
    res.writeHead(200, { 'Content-Type': MIME['.json'] });
    return res.end(JSON.stringify(config.oyun || {}));
  }
  const file = path.normalize(path.join(__dirname, 'public', url));
  if (!file.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Bulunamadı'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

// ---------- WebSocket (overlay + panel) ----------
const wss = new WebSocketServer({ server });
let lastStatus = { type: 'status', state: 'starting', message: 'Başlatılıyor...' };

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
}
function status(state, message) {
  lastStatus = { type: 'status', state, message };
  console.log(`[durum] ${message}`);
  broadcast(lastStatus);
}

wss.on('connection', ws => {
  ws.send(JSON.stringify(lastStatus));
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    // Panel komutları şifre ister (PANEL_SIFRE ayarlıysa)
    if (PANEL_SIFRE && m.sifre !== PANEL_SIFRE) return ws.send(JSON.stringify({ type: 'auth', ok: false }));
    delete m.sifre;
    if (m.type === 'login') return ws.send(JSON.stringify({ type: 'auth', ok: true, user: username }));
    if (m.type === 'cmd' && m.cmd === 'setUser') { const u = clean(m.user); if (u) startTikTok(u); return; }
    if (m.type === 'cmd' && m.cmd === 'demo') { stopTikTok().then(startDemo); return; }
    // Panelden gelen komutlar ve test olayları tüm overlay'lere iletilir
    if (m.type === 'cmd' || ['chat', 'like', 'gift', 'follow', 'share'].includes(m.type)) broadcast(m);
  });
});

// ---------- TikTok bağlantısı ----------
let current = null; // { conn, gen }
let gen = 0;
async function stopTikTok() {
  gen++;
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  if (current) { try { await current.conn.disconnect(); } catch {} current = null; }
}
async function startTikTok(user) {
  await stopTikTok();
  username = user;
  const my = gen;
  connectTikTok(my).catch(e => status('offline', 'TikTok modülü yüklenemedi: ' + e.message + ' (npm install çalıştırdın mı?)'));
}
async function connectTikTok(my) {
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = await import('tiktok-live-connector');
  if (my !== gen) return;
  const opts = { enableExtendedGiftInfo: false };
  if (EULER_KEY) opts.signApiKey = EULER_KEY;
  const conn = new TikTokLiveConnection(username, opts);
  current = { conn, gen: my };
  const alive = () => my === gen;

  const who = d => ({ user: d.user?.uniqueId || 'anonim', name: d.user?.nickname || d.user?.uniqueId || 'Anonim' });

  conn.on(WebcastEvent.CHAT, d => broadcast({ type: 'chat', ...who(d), text: d.comment || '' }));
  conn.on(WebcastEvent.LIKE, d => broadcast({ type: 'like', ...who(d), count: d.likeCount || 1 }));
  conn.on(WebcastEvent.GIFT, d => {
    const g = d.giftDetails || {};
    // Seri hediyelerde sadece seri bitince say (çift saymayı önler)
    if (g.giftType === 1 && !d.repeatEnd) return;
    const count = d.repeatCount || 1;
    broadcast({ type: 'gift', ...who(d), gift: g.giftName || 'Hediye', diamonds: (g.diamondCount || 1) * count, count });
  });
  conn.on(WebcastEvent.FOLLOW, d => broadcast({ type: 'follow', ...who(d) }));
  conn.on(WebcastEvent.SHARE, d => broadcast({ type: 'share', ...who(d) }));
  conn.on(WebcastEvent.STREAM_END, () => { if (!alive()) return; status('offline', 'Yayın bitti. Yeniden bağlanmayı deneyeceğim...'); retry(); });
  conn.on(ControlEvent.DISCONNECTED, () => { if (!alive()) return; status('offline', 'Bağlantı koptu. Yeniden bağlanılıyor...'); retry(); });

  let retrying = false;
  async function attempt() {
    if (!alive()) return;
    try {
      status('connecting', `@${username} yayınına bağlanılıyor...`);
      const st = await conn.connect();
      if (!alive()) { conn.disconnect().catch(() => {}); return; }
      status('live', `@${username} yayınına bağlandı (oda ${st.roomId})`);
    } catch (e) {
      if (!alive()) return;
      const msg = String(e?.message || e);
      const offline = /offline|not live|UserOffline|Room ID/i.test(msg + (e?.name || ''));
      status('offline', offline ? `@${username} yayını bulunamadı (canlı yayında değil ya da TikTok bağlantıyı reddetti). 15 sn sonra tekrar denenecek.` : `Bağlanamadı: ${msg}. 15 sn sonra tekrar denenecek.`);
      retry();
    }
  }
  function retry() {
    if (retrying) return;
    retrying = true;
    setTimeout(() => { retrying = false; if (alive() && !conn.isConnected) attempt(); }, 15000);
  }
  attempt();
}

// ---------- Demo modu (TikTok olmadan sahte izleyiciler) ----------
let demoTimer = null;
function startDemo() {
  if (demoTimer) clearInterval(demoTimer);
  status('live', 'DEMO modu: sahte izleyiciler oynuyor');
  const names = ['Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Deniz', 'Ece', 'Emre', 'Selin', 'Kerem', 'Irmak', 'Mert', 'Defne', 'Ali', 'Nehir'];
  const gifts = [['Gül', 1], ['TikTok', 1], ['Parfüm', 20], ['El Sallama', 5], ['Kalp', 10], ['Aslan', 100]];
  demoTimer = setInterval(() => {
    const n = names[Math.floor(Math.random() * names.length)];
    const user = n.toLowerCase();
    const r = Math.random();
    if (r < 0.45) broadcast({ type: 'chat', user, name: n, text: Math.random() < 0.5 ? '1' : '2' });
    else if (r < 0.9) broadcast({ type: 'like', user, name: n, count: 1 + Math.floor(Math.random() * 15) });
    else if (r < 0.97) { const [g, d] = gifts[Math.floor(Math.random() * gifts.length)]; broadcast({ type: 'gift', user, name: n, gift: g, diamonds: d, count: 1 }); }
    else broadcast({ type: Math.random() < 0.5 ? 'follow' : 'share', user, name: n });
  }, 350);
}

server.listen(PORT, () => {
  console.log('');
  console.log('  TikTok Halat Çekme çalışıyor!');
  console.log(`  Oyun ekranı (yayına ekle):  http://localhost:${PORT}/`);
  console.log(`  Kontrol paneli:             http://localhost:${PORT}/panel`);
  console.log(PANEL_SIFRE ? '  Panel şifre korumalı.' : '  Uyarı: PANEL_SIFRE ayarlı değil, panel herkese açık.');
  console.log('');
  if (DEMO) return startDemo();
  if (!username) {
    status('offline', 'TikTok kullanıcı adı ayarlı değil. Kontrol panelinden kullanıcı adını yazıp Bağlan\'a bas.');
    return;
  }
  startTikTok(username);
});
