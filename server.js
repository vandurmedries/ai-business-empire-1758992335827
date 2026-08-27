const http = require('http');
const crypto = require('crypto');
const { calculate, schema } = require('./lib/engine');
const { createPublicPages } = require('./lib/public-pages');
const { createDashboardPage } = require('./lib/dashboard-page');

const PORT = Number(process.env.PORT || 3000);
const CHECKOUT_URL = process.env.CHECKOUT_URL || 'https://buy.stripe.com/9B6eVe2lf5GF8LkbSJ5Vu0c';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'demandmine@agentmail.to';
const BASE_URL = (process.env.BASE_URL || 'https://demandmine.onrender.com').replace(/\/$/, '');
const config = { checkoutUrl: CHECKOUT_URL, supportEmail: SUPPORT_EMAIL, baseUrl: BASE_URL };
const pages = createPublicPages(config);
const { dashboard } = createDashboardPage(config, pages);

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(req) {
  const cookies = {};
  for (const pair of (req.headers.cookie || '').split(';')) {
    const index = pair.indexOf('=');
    if (index > -1) {
      const key = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      try { cookies[key] = decodeURIComponent(value); } catch { cookies[key] = value; }
    }
  }
  return cookies;
}

function send(res, status, body, contentType = 'text/html; charset=utf-8', headers = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'none'",
    ...headers
  });
  res.end(body);
}

function sendJson(res, status, payload, headers = {}) {
  send(res, status, JSON.stringify(payload, null, 2), 'application/json; charset=utf-8', headers);
}

function readJson(req, limit = 100_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limit) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const offer = {
  schema_version: '1.0',
  id: 'demandmine.product-decision-passport.founding-access',
  name: 'DemandMine Product Decision Passport',
  description: 'Convert product sourcing assumptions into an auditable GO, VALIDATE or NO-BUY decision passport.',
  provider: { name: 'DemandMine', support_email: SUPPORT_EMAIL, website: BASE_URL },
  price: { amount: '12.00', currency: 'EUR', billing: 'one_time', taxes: 'calculated_at_checkout' },
  checkout_url: CHECKOUT_URL,
  delivery: { type: 'instant_redirect', access: `${BASE_URL}/dashboard` },
  capabilities: [
    'landed_cost', 'net_profit', 'net_margin', 'roi', 'break_even_price',
    'max_viable_source_cost', 'downside_scenarios', 'risk_flags',
    'validation_plan', 'json_export', 'csv_export', 'local_decision_log'
  ],
  api: { score: { method: 'POST', url: `${BASE_URL}/api/score`, content_type: 'application/json' } },
  refund_policy: { days: 14, contact: SUPPORT_EMAIL },
  disclaimers: ['Informational decision support', 'No demand or profit guarantee']
};

const agentCard = {
  protocolVersion: '0.3.0',
  name: 'DemandMine Product Decision Agent',
  description: 'Scores product sourcing and resale assumptions and returns a portable Product Decision Passport.',
  url: BASE_URL,
  preferredTransport: 'HTTP+JSON',
  provider: { organization: 'DemandMine', url: BASE_URL },
  version: '1.0.0',
  documentationUrl: `${BASE_URL}/offer.json`,
  capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  skills: [{
    id: 'score-product-decision',
    name: 'Score product decision',
    description: 'Compute unit economics, stress tests, opportunity score, risks, validation tasks and verdict.',
    tags: ['product-research', 'unit-economics', 'reselling', 'sourcing', 'decision-support'],
    examples: ['Should I source this item at €13.20 and sell it for €32.95?']
  }]
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (path === '/health') return sendJson(res, 200, { ok: true, product: 'demandmine-decision-passport', version: '2.0.0' });
  if (path === '/robots.txt') return send(res, 200, 'User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /access\n', 'text/plain; charset=utf-8');
  if (path === '/sitemap.xml') return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${BASE_URL}/</loc></url><url><loc>${BASE_URL}/terms</loc></url><url><loc>${BASE_URL}/privacy</loc></url></urlset>`, 'application/xml; charset=utf-8');
  if (path === '/offer.json') return sendJson(res, 200, offer, { 'Access-Control-Allow-Origin': '*' });
  if (path === '/.well-known/agent-card.json') return sendJson(res, 200, agentCard, { 'Access-Control-Allow-Origin': '*' });
  if (path === '/schemas/decision-passport-v1.json') return sendJson(res, 200, schema(BASE_URL), { 'Access-Control-Allow-Origin': '*' });
  if (path === '/llms.txt') return send(res, 200, `# DemandMine\n\nProduct Decision Passport for sourcing and resale decisions.\n\n- Offer: ${BASE_URL}/offer.json\n- Agent card: ${BASE_URL}/.well-known/agent-card.json\n- Score API: POST ${BASE_URL}/api/score\n- Checkout: ${CHECKOUT_URL}\n- Support: ${SUPPORT_EMAIL}\n`, 'text/plain; charset=utf-8', { 'Access-Control-Allow-Origin': '*' });

  if (path === '/api/score' && req.method === 'OPTIONS') return send(res, 204, '', 'text/plain', {
    'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'
  });
  if (path === '/api/score' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      return sendJson(res, 200, calculate(body, BASE_URL), { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.message || 'Calculation failed' }, { 'Access-Control-Allow-Origin': '*' });
    }
  }

  if (path === '/access') {
    const supplied = url.searchParams.get('token') || '';
    if (!ACCESS_TOKEN || !safeEqual(supplied, ACCESS_TOKEN)) {
      const denied = pages.layout('Access denied', 'Invalid access link.', `<div class="wrap locked"><h1>Access denied</h1><p class="muted">This access link is invalid. Use the link shown after checkout or contact support.</p><div class="actions" style="justify-content:center"><a class="btn" href="/">Back</a><a class="btn primary" href="mailto:${pages.escapeHtml(SUPPORT_EMAIL)}">Contact support</a></div></div>`, '', { path: '/access', noindex: true });
      return send(res, 403, denied);
    }
    return send(res, 302, '', 'text/plain', {
      'Set-Cookie': `dm_access=${encodeURIComponent(ACCESS_TOKEN)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
      Location: '/dashboard'
    });
  }

  if (path === '/logout') return send(res, 302, '', 'text/plain', {
    'Set-Cookie': 'dm_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0', Location: '/'
  });
  if (path === '/dashboard') {
    const cookie = parseCookies(req).dm_access || '';
    if (!ACCESS_TOKEN || !safeEqual(cookie, ACCESS_TOKEN)) return send(res, 302, '', 'text/plain', { Location: '/?locked=1' });
    return send(res, 200, dashboard(), 'text/html; charset=utf-8', { 'Cache-Control': 'private, no-store' });
  }
  if (path === '/terms') return send(res, 200, pages.documentPage('terms'));
  if (path === '/privacy') return send(res, 200, pages.documentPage('privacy'));
  if (path === '/' || path === '/index.html') return send(res, 200, pages.landing(url.searchParams.get('locked') === '1'));

  const notFound = pages.layout('Not found', 'Page not found.', '<div class="wrap locked"><h1>404</h1><p class="muted">Nothing here.</p><a class="btn" href="/">Go home</a></div>', '', { path, noindex: true });
  return send(res, 404, notFound);
});

server.listen(PORT, () => console.log(`DemandMine Decision Passport listening on ${PORT}`));
