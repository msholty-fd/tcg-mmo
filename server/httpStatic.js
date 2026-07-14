// HTTP layer: /health check + static serving of the built client (client/dist,
// if present) and the WS origin / client-IP helpers. No game state here.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

export function createHttpServer(distDir) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
    const file = path.normalize(path.join(distDir, urlPath === '/' ? 'index.html' : urlPath));
    if (!file.startsWith(distDir)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('not found' + (fs.existsSync(distDir) ? '' : ' — client not built (npm run build)'));
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

// browsers send Origin on WS connects; only accept our own host (any port, so
// the Vite dev client works) or an explicit ALLOWED_ORIGIN. Non-browser
// clients send no Origin — that's fine, scripts can fake it anyway.
export function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) return true;
  try {
    const host = new URL(origin).hostname;
    const reqHost = String(req.headers.host || '').replace(/:\d+$/, '');
    return host === reqHost || host === 'localhost' || host === '127.0.0.1';
  } catch { return false; }
}

export const clientIp = req =>
  (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '')
  || req.socket.remoteAddress;
