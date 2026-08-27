const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const CHECKOUT_URL = process.env.CHECKOUT_URL || 'https://buy.stripe.com/5kQaEYaRLedb7Hg6yp5Vu0b';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > -1) out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

function safeEqual(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function send(res, status, body, contentType = 'text/html; charset=utf-8', headers = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'none'",
    ...headers
  });
  res.end(body);
}

const baseCss = `
:root{--bg:#081018;--panel:#101b27;--panel2:#132333;--text:#eef7ff;--muted:#97aabd;--line:#213446;--accent:#51f0b3;--accent2:#75a7ff;--warning:#ffd166;--danger:#ff7b8a}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0,#13283c 0,transparent 34%),var(--bg);color:var(--text);font:16px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit}.wrap{width:min(1140px,92vw);margin:auto}.nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}.brand{font-weight:850;letter-spacing:-.04em;font-size:24px}.brand span{color:var(--accent)}.pill{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;padding:8px 12px;color:var(--muted);font-size:13px;background:#0d1721}.hero{padding:70px 0 42px;display:grid;grid-template-columns:1.25fr .75fr;gap:44px;align-items:center}.eyebrow{color:var(--accent);font-weight:760;letter-spacing:.08em;text-transform:uppercase;font-size:12px}.hero h1{font-size:clamp(46px,7vw,84px);line-height:.98;letter-spacing:-.065em;margin:15px 0 22px}.hero p{color:var(--muted);font-size:19px;max-width:700px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.btn{display:inline-block;padding:14px 19px;border-radius:12px;text-decoration:none;font-weight:780;border:1px solid var(--line);background:#132333}.btn.primary{background:var(--accent);color:#04120d;border-color:var(--accent)}.btn:hover{transform:translateY(-1px)}.card{background:linear-gradient(180deg,#122231,#0d1823);border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 24px 70px #0006}.metric{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line)}.metric:last-child{border-bottom:0}.metric b{font-size:20px}.good{color:var(--accent)}.muted{color:var(--muted)}.section{padding:56px 0}.section h2{font-size:clamp(32px,4vw,52px);letter-spacing:-.045em;margin:0 0 12px}.section .lead{color:var(--muted);max-width:780px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:26px}.feature{border:1px solid var(--line);border-radius:16px;background:#0d1823;padding:21px}.feature h3{margin:8px 0}.feature p{color:var(--muted);margin:0}.price{display:flex;align-items:baseline;gap:7px;margin:18px 0}.price strong{font-size:54px;letter-spacing:-.06em}.price span{color:var(--muted)}.demo-table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}.demo-table th,.demo-table td{padding:13px 10px;border-bottom:1px solid var(--line);text-align:left}.demo-table th{color:var(--muted);font-weight:650}.score{display:inline-block;padding:5px 9px;border-radius:999px;background:#173628;color:var(--accent);font-weight:760}.notice{border:1px solid #594d28;background:#231f13;color:#f0d887;border-radius:12px;padding:13px 15px;font-size:13px;margin-top:18px}.footer{padding:42px 0 60px;color:var(--muted);border-top:1px solid var(--line);margin-top:36px}.dashboard{padding:28px 0 70px}.dash-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:24px}.dash-head h1{margin:0;font-size:44px;letter-spacing:-.05em}.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.calc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.field label{font-size:12px;color:var(--muted);display:block;margin-bottom:5px}.field input{width:100%;background:#07111b;border:1px solid var(--line);border-radius:10px;padding:11px;color:var(--text);font:inherit}.results{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:18px}.result{background:#08131d;border:1px solid var(--line);border-radius:11px;padding:13px}.result small{color:var(--muted);display:block}.result strong{font-size:24px}.opp-controls{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.opp-controls input,.opp-controls select{background:#07111b;border:1px solid var(--line);border-radius:9px;padding:9px;color:var(--text)}.opps{display:grid;gap:12px}.opp{border:1px solid var(--line);border-radius:13px;padding:16px;background:#0b1721}.opp-top{display:flex;justify-content:space-between;gap:16px}.opp h3{margin:0 0 5px}.opp-meta{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:13px}.tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#12283a;color:#b6d3ef;font-size:12px}.small{font-size:12px}.locked{text-align:center;padding:80px 0}.legal{color:var(--muted);font-size:12px;max-width:880px}@media(max-width:800px){.hero,.grid3,.dash-grid{grid-template-columns:1fr}.hero{padding-top:38px}.calc-grid{grid-template-columns:1fr}.dash-head{align-items:flex-start;flex-direction:column}.demo-table{display:block;overflow-x:auto}}
`;

function layout(title, content, extraScript = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="DemandMine surfaces and scores product-demand opportunities before they get crowded."><style>${baseCss}</style></head><body>${content}${extraScript ? `<script>${extraScript}</script>` : ''}</body></html>`;
}

function landing(locked) {
  const checkout = escapeHtml(CHECKOUT_URL);
  return layout('DemandMine — Find demand before the crowd', `
  <div class="wrap">
    <nav class="nav"><div class="brand">Demand<span>Mine</span></div><div class="pill">Early Access · €29/month</div></nav>
    <main class="hero">
      <div>
        <div class="eyebrow">Demand-before-supply intelligence</div>
        <h1>Find what buyers want before sellers crowd in.</h1>
        <p>DemandMine turns demand, competition, landed cost and marketplace fees into one ranked opportunity score. Built for resellers, craft-supply sellers and product scouts.</p>
        <div class="actions"><a class="btn primary" href="${checkout}">Get Early Access — €29/mo</a><a class="btn" href="#demo">See the product</a></div>
        ${locked ? '<div class="notice">The dashboard is for paid early-access members. Subscribe to unlock it.</div>' : ''}
      </div>
      <div class="card">
        <div class="eyebrow">Opportunity snapshot</div>
        <div class="metric"><span class="muted">Demand score</span><b>86 / 100</b></div>
        <div class="metric"><span class="muted">Competition</span><b>Low</b></div>
        <div class="metric"><span class="muted">Estimated profit</span><b class="good">€14.72</b></div>
        <div class="metric"><span class="muted">ROI</span><b class="good">91%</b></div>
        <div class="notice">Illustrative example. DemandMine estimates are decision support, not guaranteed sales or profit.</div>
      </div>
    </main>

    <section class="section" id="demo">
      <div class="eyebrow">What exists today</div><h2>A working opportunity engine, not a spreadsheet pitch.</h2>
      <p class="lead">Early Access includes a browser dashboard with ranked example opportunities, a configurable profit engine, competition weighting and a validation workflow. The opportunity feed starts with craft-supply and reseller-friendly categories and expands as source coverage grows.</p>
      <div class="grid3">
        <div class="feature"><div>01</div><h3>Opportunity scoring</h3><p>Combine buyer-demand strength, seller crowding and unit economics into one 0–100 score.</p></div>
        <div class="feature"><div>02</div><h3>True-margin calculator</h3><p>Model sourcing cost, shipping, marketplace fees, ad spend and a return reserve before buying stock.</p></div>
        <div class="feature"><div>03</div><h3>Validation workflow</h3><p>Every lead is treated as a hypothesis: validate supplier terms, marketplace eligibility and current demand before purchase.</p></div>
      </div>
      <table class="demo-table"><thead><tr><th>Example opportunity</th><th>Category</th><th>Demand</th><th>Competition</th><th>Est. profit</th><th>Score</th></tr></thead><tbody>
        <tr><td>Wax seal bead color bundle</td><td>Craft supply</td><td>High</td><td>Medium</td><td>€11.40</td><td><span class="score">84</span></td></tr>
        <tr><td>Leather alphabet stamp set</td><td>Craft tool</td><td>Medium-high</td><td>Low</td><td>€13.90</td><td><span class="score">82</span></td></tr>
        <tr><td>Jewelry spacer findings bundle</td><td>Craft supply</td><td>High</td><td>Medium</td><td>€9.80</td><td><span class="score">78</span></td></tr>
      </tbody></table>
      <div class="notice">The rows above are example data for demonstrating the workflow, not live marketplace measurements. Paid access is sold as Early Access while live source coverage is being expanded.</div>
    </section>

    <section class="section"><div class="card"><div class="eyebrow">Early-access plan</div><h2>Start before the dataset gets expensive.</h2><div class="price"><strong>€29</strong><span>/ month</span></div><p class="lead">Cancel anytime. Includes the dashboard, opportunity-scoring tools and new feed improvements released during your subscription.</p><div class="actions"><a class="btn primary" href="${checkout}">Subscribe with Stripe</a></div></div></section>

    <footer class="footer"><div class="brand">Demand<span>Mine</span></div><p class="legal">DemandMine provides informational estimates and product-research tooling. It does not guarantee sales, profit, marketplace approval or supplier performance. Always validate listing eligibility, intellectual-property rights, taxes, shipping, returns and marketplace rules before sourcing or listing a product.</p></footer>
  </div>`);
}

const opportunities = [
  {name:'Wax seal bead color bundle',category:'Craft supply',demand:88,competition:42,cost:6.2,sale:21.95,profit:11.4,score:84,note:'Bundle colors around a specific wedding or journaling use-case.'},
  {name:'Leather alphabet stamp set',category:'Craft tool',demand:79,competition:31,cost:13.2,sale:32.95,profit:13.9,score:82,note:'Validate character size, material and destination shipping before sourcing.'},
  {name:'Jewelry spacer findings bundle',category:'Craft supply',demand:91,competition:58,cost:5.4,sale:19.95,profit:9.8,score:78,note:'Differentiation depends on coherent curated bundles rather than generic quantity.'},
  {name:'Clay texture roller — botanical motif',category:'Craft tool',demand:74,competition:36,cost:7.8,sale:25.95,profit:12.1,score:80,note:'Confirm design/IP rights and whether the item qualifies for the target marketplace.'},
  {name:'Miniature terrarium tool kit',category:'Craft tool',demand:71,competition:34,cost:8.9,sale:27.95,profit:12.3,score:79,note:'A strong use-case photo and compact kit positioning can matter more than raw item count.'},
  {name:'Pressed-flower frame findings pack',category:'Craft supply',demand:68,competition:29,cost:4.9,sale:18.95,profit:9.7,score:77,note:'Validate exact material composition and listing category before selling.'}
];

function dashboard() {
  const data = JSON.stringify(opportunities).replace(/</g,'\\u003c');
  return layout('DemandMine Dashboard', `
  <div class="wrap dashboard">
    <nav class="nav"><div class="brand">Demand<span>Mine</span></div><div><span class="pill">Early Access</span> <a class="btn" href="/logout">Log out</a></div></nav>
    <header class="dash-head"><div><div class="eyebrow">Opportunity intelligence</div><h1>Dashboard</h1><p class="muted">Score ideas before you spend money.</p></div><div class="pill">Dataset: illustrative MVP · validate before sourcing</div></header>
    <div class="dash-grid">
      <section class="card"><div class="eyebrow">Profit engine</div><h2>Unit economics</h2><div class="calc-grid">
        <div class="field"><label>Sourcing cost (€)</label><input id="cost" type="number" step="0.01" value="13.20"></div>
        <div class="field"><label>Inbound/direct shipping (€)</label><input id="ship" type="number" step="0.01" value="2.80"></div>
        <div class="field"><label>Selling price (€)</label><input id="sale" type="number" step="0.01" value="32.95"></div>
        <div class="field"><label>Marketplace + payment fees (%)</label><input id="fees" type="number" step="0.1" value="10.5"></div>
        <div class="field"><label>Ad spend reserve (%)</label><input id="ads" type="number" step="0.1" value="5"></div>
        <div class="field"><label>Returns/issue reserve (%)</label><input id="returns" type="number" step="0.1" value="3"></div>
        <div class="field"><label>Demand strength (0–100)</label><input id="demand" type="number" min="0" max="100" value="79"></div>
        <div class="field"><label>Competition (0–100)</label><input id="competition" type="number" min="0" max="100" value="31"></div>
      </div><div class="results"><div class="result"><small>Net profit</small><strong id="profit">—</strong></div><div class="result"><small>Margin</small><strong id="margin">—</strong></div><div class="result"><small>ROI on landed cost</small><strong id="roi">—</strong></div><div class="result"><small>DemandMine score</small><strong id="calcScore">—</strong></div></div></section>
      <section class="card"><div class="eyebrow">How to use it</div><h2>Validation gate</h2><p class="muted">A high score is a lead, not permission to list blindly.</p><div class="metric"><span>1. Marketplace eligibility</span><b>Check</b></div><div class="metric"><span>2. Supplier reliability</span><b>Check</b></div><div class="metric"><span>3. Current landed cost</span><b>Check</b></div><div class="metric"><span>4. Current competition</span><b>Check</b></div><div class="metric"><span>5. IP / brand restrictions</span><b>Check</b></div><div class="notice">For Etsy-style arbitrage, ordinary mass-produced resale can violate marketplace rules. Verify that the specific item/category and fulfillment method are allowed before listing.</div></section>
    </div>

    <section class="section"><div class="eyebrow">Opportunity feed</div><h2>Ranked hypotheses</h2><p class="lead">These examples demonstrate the engine. They are deliberately labelled as hypotheses until live marketplace-source integrations are connected.</p><div class="opp-controls"><input id="search" placeholder="Search opportunities"><select id="minScore"><option value="0">Any score</option><option value="75">75+</option><option value="80">80+</option><option value="85">85+</option></select><input id="minProfit" type="number" step="1" value="0" min="0" placeholder="Min profit €"></div><div id="opps" class="opps"></div></section>
    <footer class="footer"><p class="legal">DemandMine estimates are informational. Source prices, platform fees, taxes, shipping, demand and marketplace rules can change. Validate before purchase or listing.</p></footer>
  </div>`, `
  const OPPS=${data};
  const ids=['cost','ship','sale','fees','ads','returns','demand','competition'];
  const euro=n=>'€'+(Number.isFinite(n)?n:0).toFixed(2);
  function calc(){
    const v=Object.fromEntries(ids.map(id=>[id,parseFloat(document.getElementById(id).value)||0]));
    const landed=v.cost+v.ship;
    const variable=v.sale*((v.fees+v.ads+v.returns)/100);
    const profit=v.sale-landed-variable;
    const margin=v.sale?profit/v.sale*100:0;
    const roi=landed?profit/landed*100:0;
    const unitScore=Math.max(0,Math.min(100,50+(margin-20)*0.7+(roi-40)*0.12));
    const score=Math.round(Math.max(0,Math.min(100,v.demand*.48+(100-v.competition)*.27+unitScore*.25)));
    document.getElementById('profit').textContent=euro(profit);
    document.getElementById('margin').textContent=margin.toFixed(1)+'%';
    document.getElementById('roi').textContent=roi.toFixed(0)+'%';
    document.getElementById('calcScore').textContent=score+'/100';
  }
  ids.forEach(id=>document.getElementById(id).addEventListener('input',calc));calc();
  function render(){
    const q=document.getElementById('search').value.toLowerCase();
    const minScore=+document.getElementById('minScore').value;
    const minProfit=+document.getElementById('minProfit').value||0;
    const items=OPPS.filter(o=>(o.name+' '+o.category).toLowerCase().includes(q)&&o.score>=minScore&&o.profit>=minProfit).sort((a,b)=>b.score-a.score);
    document.getElementById('opps').innerHTML=items.map(o=>\`<article class="opp"><div class="opp-top"><div><span class="tag">\${o.category}</span><h3>\${o.name}</h3><div class="opp-meta"><span>Demand \${o.demand}/100</span><span>Competition \${o.competition}/100</span><span>Cost €\${o.cost.toFixed(2)}</span><span>Target €\${o.sale.toFixed(2)}</span><span>Est. profit €\${o.profit.toFixed(2)}</span></div></div><span class="score">\${o.score}</span></div><p class="muted small">\${o.note}</p></article>\`).join('')||'<div class="notice">No examples match those filters.</div>';
  }
  ['search','minScore','minProfit'].forEach(id=>document.getElementById(id).addEventListener('input',render));render();
  `);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  if (path === '/health') return send(res, 200, JSON.stringify({ok:true,product:'demandmine'}), 'application/json; charset=utf-8');
  if (path === '/robots.txt') return send(res, 200, 'User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /access\n', 'text/plain; charset=utf-8');
  if (path === '/access') {
    const supplied = url.searchParams.get('token') || '';
    if (!ACCESS_TOKEN || !safeEqual(supplied, ACCESS_TOKEN)) return send(res, 403, layout('Access denied', '<div class="wrap locked"><h1>Access denied</h1><p class="muted">This access link is invalid.</p><a class="btn" href="/">Back to DemandMine</a></div>'));
    return send(res, 302, '', 'text/plain', {'Set-Cookie':`dm_access=${encodeURIComponent(ACCESS_TOKEN)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,'Location':'/dashboard'});
  }
  if (path === '/logout') return send(res, 302, '', 'text/plain', {'Set-Cookie':'dm_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0','Location':'/'});
  if (path === '/dashboard') {
    const cookie = parseCookies(req).dm_access || '';
    if (!ACCESS_TOKEN || !safeEqual(cookie, ACCESS_TOKEN)) return send(res, 302, '', 'text/plain', {'Location':'/?locked=1'});
    return send(res, 200, dashboard());
  }
  if (path === '/' || path === '/index.html') return send(res, 200, landing(url.searchParams.get('locked') === '1'));
  return send(res, 404, layout('Not found','<div class="wrap locked"><h1>404</h1><p class="muted">Nothing here.</p><a class="btn" href="/">Go home</a></div>'));
});

server.listen(PORT, () => console.log(`DemandMine listening on ${PORT}`));
