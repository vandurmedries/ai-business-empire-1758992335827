const css = require('./style');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function createPublicPages({ checkoutUrl, supportEmail, baseUrl }) {
  function layout(title, description, content, script = '', options = {}) {
    const canonical = `${baseUrl}${options.path || ''}`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${options.noindex ? 'noindex,nofollow' : 'index,follow'}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(canonical)}"><style>${css}</style>${options.head || ''}</head><body>${content}${script ? `<script>${script}</script>` : ''}</body></html>`;
  }

  function navigation(loggedIn = false) {
    return `<nav class="nav"><a class="brand" href="/">Demand<span>Mine</span></a><div class="navlinks"><a href="/#how">How it works</a><a href="/terms">Terms</a><a href="mailto:${escapeHtml(supportEmail)}">Support</a>${loggedIn ? '<a class="btn smallbtn" href="/logout">Log out</a>' : `<a class="btn smallbtn primary" href="${escapeHtml(checkoutUrl)}">Get access — €12</a>`}</div></nav>`;
  }

  function landing(locked = false) {
    const structuredData = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'DemandMine Product Decision Passport', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      description: 'Product sourcing decision tool with unit economics, stress tests, risks and downloadable decision passports.',
      offers: { '@type': 'Offer', price: '12.00', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: checkoutUrl }
    }).replace(/</g, '\\u003c');
    return layout(
      'DemandMine Product Decision Passport — Know before you buy stock',
      'Turn a product idea into a structured GO, VALIDATE or NO-BUY decision with profit math, stress tests, risks and downloadable evidence.',
      `<div class="wrap">${navigation(false)}
        <main class="hero"><div><div class="eyebrow">A decision file for every product idea</div><h1>Know whether a product survives before you buy stock.</h1><p>DemandMine converts your price, costs, fees, demand evidence, competition and supplier confidence into one auditable Product Decision Passport: unit economics, break-even, maximum viable sourcing cost, downside tests, red flags and a clear verdict.</p><div class="actions"><a class="btn primary" href="${escapeHtml(checkoutUrl)}">Founding access — €12 once</a><a class="btn" href="#how">See exactly what you get</a></div><p class="legal">One-time payment. No subscription. Immediate browser access. 14-day refund policy.</p>${locked ? '<div class="notice">The decision workspace is paid access. Complete checkout to unlock it immediately.</div>' : ''}</div>
        <div class="card hero-card"><div class="eyebrow">Example decision</div><div class="verdict">VALIDATE</div><div class="metric"><span>Opportunity score</span><b>68 / 100</b></div><div class="metric"><span>Base margin</span><b>27.4%</b></div><div class="metric"><span>Break-even price</span><b>€21.46</b></div><div class="metric"><span>Max source cost</span><b>€13.85</b></div><div class="metric"><span>Combined downside</span><b>−€0.82</b></div><div class="notice">The tool does not invent demand. It makes your assumptions explicit and tells you what still needs proof.</div></div></main>
        <section class="section" id="how"><div class="eyebrow">Not another generic profit spreadsheet</div><h2>One portable decision record, built to stop expensive guesses.</h2><p class="lead">Most calculators end with a margin percentage. DemandMine continues through downside risk, evidence quality and a validation plan, then exports the complete reasoning as structured JSON or CSV.</p><div class="grid3"><article class="feature"><div class="num">01</div><h3>Calculate the real economics</h3><p>Landed cost, variable fees, net profit, margin, ROI, break-even selling price and the maximum source cost that still meets your target.</p></article><article class="feature"><div class="num">02</div><h3>Try to break the idea</h3><p>Automatic tests for source cost +15%, selling price −10%, returns +5 points and a combined downside case.</p></article><article class="feature"><div class="num">03</div><h3>Export the decision</h3><p>Download a timestamped JSON passport for agents and automation, a CSV record for spreadsheets, or a printable report.</p></article></div></section>
        <section class="section"><div class="card"><div class="eyebrow">Founding offer</div><h2>Unlimited product decisions. Pay once.</h2><div class="price"><strong>€12</strong><span>one time, tax calculated at checkout</span></div><div class="grid3"><div class="feature"><h3>Decision engine</h3><p>Unlimited calculations, GO / VALIDATE / NO-BUY verdicts and evidence-based action plans.</p></div><div class="feature"><h3>Private by default</h3><p>Your saved passports stay in your own browser. DemandMine has no advertising tracker or product database.</p></div><div class="feature"><h3>Founding access</h3><p>Immediate access to this version and improvements released to the founding workspace.</p></div></div><div class="actions"><a class="btn primary" href="${escapeHtml(checkoutUrl)}">Buy founding access</a><a class="btn" href="mailto:${escapeHtml(supportEmail)}?subject=DemandMine%20question">Ask a question</a></div><div class="notice goodbox">Refund request within 14 days: email ${escapeHtml(supportEmail)} from the purchase address.</div></div></section>
        <footer class="footer"><a class="brand" href="/">Demand<span>Mine</span></a><div class="footerlinks"><a href="/terms">Terms & refunds</a><a href="/privacy">Privacy</a><a href="/offer.json">Machine-readable offer</a><a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></div><p class="legal">DemandMine is informational decision support. It does not guarantee demand, marketplace eligibility, sales, supplier performance or profit. Validate current platform rules, intellectual-property rights, taxes, shipping, returns and supplier terms before sourcing or listing.</p></footer></div>`,
      '', { path: '/', head: `<script type="application/ld+json">${structuredData}</script>` }
    );
  }

  function documentPage(type) {
    const isTerms = type === 'terms';
    const title = isTerms ? 'Terms, licence and refund policy' : 'Privacy policy';
    const body = isTerms ? `
      <p><strong>Last updated: 27 August 2026.</strong></p>
      <h2>Product and licence</h2><p>DemandMine Product Decision Passport is a browser-based decision-support tool. A completed one-time purchase grants the purchaser a non-exclusive, non-transferable licence to use the hosted workspace for their own personal or internal business decisions. The software, branding and templates may not be resold, sublicensed or presented as another product.</p>
      <h2>Immediate digital delivery</h2><p>Access is delivered immediately after successful Stripe checkout through the redirect shown on the payment confirmation. Keep the purchase email and access link. Contact ${escapeHtml(supportEmail)} if access fails.</p>
      <h2>14-day refund policy</h2><p>A purchaser may request a refund within 14 calendar days of purchase by emailing ${escapeHtml(supportEmail)} from the purchase email address. Include the purchase date. This contractual refund policy does not reduce any mandatory consumer rights that apply in the purchaser’s jurisdiction.</p>
      <h2>No guarantee</h2><p>DemandMine processes assumptions supplied by the user. It does not independently verify demand, suppliers, marketplace eligibility, intellectual-property rights, taxes, delivery, returns or future prices. Results are informational and do not guarantee sales or profit. The user remains responsible for every sourcing, listing and financial decision.</p>
      <h2>Availability and changes</h2><p>The service may be updated, repaired or temporarily unavailable. Founding access is access to the hosted product while it is operated; it is not a promise of a specific feature forever or lifetime operation of third-party infrastructure.</p>
      <h2>Contact</h2><p>Support and refund requests: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>` : `
      <p><strong>Last updated: 27 August 2026.</strong></p>
      <h2>Data processed by DemandMine</h2><p>The hosted application receives ordinary server request data needed to serve the page, such as IP address, request path, browser information and timestamps. Render and other infrastructure providers may process operational logs. DemandMine does not include an advertising tracker.</p>
      <h2>Product ideas and saved passports</h2><p>Calculations are sent to the DemandMine server to return a result. The current service does not intentionally store those request bodies in an application database. When you click “Save in browser,” the passport is stored in your browser’s localStorage and remains on that device until you delete it or clear browser data.</p>
      <h2>Payments</h2><p>Payments, billing addresses, tax information and receipts are processed by Stripe under Stripe’s own privacy terms. DemandMine does not receive or store full card details.</p>
      <h2>Access cookie</h2><p>After checkout, DemandMine sets a secure HttpOnly access cookie so the paid workspace remains unlocked in that browser. The cookie is used for access control, not advertising.</p>
      <h2>Your choices</h2><p>Do not enter confidential supplier information that you are not authorised to process. You can delete locally saved passports inside the workspace. Privacy questions can be sent to <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>`;
    return layout(title, title, `<div class="wrap doc">${navigation(false)}<h1>${title}</h1>${body}<p><a class="btn" href="/">Back to DemandMine</a></p></div>`, '', { path: `/${type}` });
  }

  return { escapeHtml, layout, navigation, landing, documentPage };
}

module.exports = { createPublicPages };
