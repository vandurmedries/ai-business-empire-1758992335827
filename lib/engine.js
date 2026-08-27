const crypto = require('crypto');

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, number(value, min)));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((number(value) + Number.EPSILON) * factor) / factor;
}

function calculate(raw = {}, baseUrl = 'https://demandmine.onrender.com') {
  const inputs = {
    productName: String(raw.productName || 'Untitled product').trim().slice(0, 120) || 'Untitled product',
    category: String(raw.category || 'Other').trim().slice(0, 80) || 'Other',
    channel: String(raw.channel || 'Marketplace').trim().slice(0, 80) || 'Marketplace',
    sourceUrl: String(raw.sourceUrl || '').trim().slice(0, 500),
    currency: 'EUR',
    sourceCost: Math.max(0, number(raw.sourceCost, 12)),
    inboundShipping: Math.max(0, number(raw.inboundShipping, 2.5)),
    packaging: Math.max(0, number(raw.packaging, 1)),
    fixedFee: Math.max(0, number(raw.fixedFee, 0.3)),
    salePrice: Math.max(0, number(raw.salePrice, 29.95)),
    marketplaceFeePct: clamp(raw.marketplaceFeePct ?? 9.5, 0, 80),
    paymentFeePct: clamp(raw.paymentFeePct ?? 3, 0, 30),
    adReservePct: clamp(raw.adReservePct ?? 5, 0, 80),
    returnReservePct: clamp(raw.returnReservePct ?? 4, 0, 80),
    targetMarginPct: clamp(raw.targetMarginPct ?? 25, 0, 90),
    demandScore: clamp(raw.demandScore ?? 65, 0, 100),
    competitionScore: clamp(raw.competitionScore ?? 50, 0, 100),
    supplierConfidence: clamp(raw.supplierConfidence ?? 65, 0, 100),
    evidenceCount: clamp(raw.evidenceCount ?? 1, 0, 10)
  };

  const scenario = (overrides = {}) => {
    const sourceCost = Math.max(0, overrides.sourceCost ?? inputs.sourceCost);
    const salePrice = Math.max(0, overrides.salePrice ?? inputs.salePrice);
    const returnReservePct = clamp(overrides.returnReservePct ?? inputs.returnReservePct, 0, 95);
    const landedCost = sourceCost + inputs.inboundShipping + inputs.packaging;
    const variableRatePct = inputs.marketplaceFeePct + inputs.paymentFeePct + inputs.adReservePct + returnReservePct;
    const variableRate = variableRatePct / 100;
    const variableCosts = salePrice * variableRate + inputs.fixedFee;
    const profit = salePrice - landedCost - variableCosts;
    const marginPct = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    const roiPct = landedCost > 0 ? (profit / landedCost) * 100 : 0;
    const breakEvenPrice = variableRate < 0.99 ? (landedCost + inputs.fixedFee) / (1 - variableRate) : Infinity;
    const contributionHeadroomPct = salePrice > 0 && Number.isFinite(breakEvenPrice)
      ? ((salePrice - breakEvenPrice) / salePrice) * 100 : 0;
    return {
      landedCost: round(landedCost),
      variableRatePct: round(variableRatePct),
      variableCosts: round(variableCosts),
      profit: round(profit),
      marginPct: round(marginPct, 1),
      roiPct: round(roiPct, 1),
      breakEvenPrice: Number.isFinite(breakEvenPrice) ? round(breakEvenPrice) : null,
      contributionHeadroomPct: round(contributionHeadroomPct, 1)
    };
  };

  const base = scenario();
  const scenarios = {
    base,
    sourceCostPlus15: scenario({ sourceCost: inputs.sourceCost * 1.15 }),
    salePriceMinus10: scenario({ salePrice: inputs.salePrice * 0.9 }),
    returnsPlus5: scenario({ returnReservePct: inputs.returnReservePct + 5 }),
    combinedDownside: scenario({
      sourceCost: inputs.sourceCost * 1.15,
      salePrice: inputs.salePrice * 0.9,
      returnReservePct: inputs.returnReservePct + 5
    })
  };

  const totalRate = (inputs.marketplaceFeePct + inputs.paymentFeePct + inputs.adReservePct + inputs.returnReservePct) / 100;
  const maxLandedCost = inputs.salePrice * (1 - totalRate - inputs.targetMarginPct / 100) - inputs.fixedFee;
  const maxSourceCost = maxLandedCost - inputs.inboundShipping - inputs.packaging;
  const marginScore = clamp((base.marginPct / Math.max(inputs.targetMarginPct, 1)) * 70 + 15, 0, 100);
  const roiScore = clamp((base.roiPct + 10) * 1.05, 0, 100);
  const stressScore = clamp((scenarios.combinedDownside.marginPct + 10) * 3, 0, 100);
  const evidenceScore = clamp(inputs.evidenceCount * 20, 0, 100);
  const economicsScore = marginScore * 0.45 + roiScore * 0.3 + stressScore * 0.25;
  let score = inputs.demandScore * 0.28 + (100 - inputs.competitionScore) * 0.17 +
    inputs.supplierConfidence * 0.12 + evidenceScore * 0.08 + economicsScore * 0.35;
  if (base.profit <= 0) score -= 30;
  if (base.marginPct < 10) score -= 12;
  if (scenarios.combinedDownside.profit < 0) score -= 8;
  score = Math.round(clamp(score, 0, 100));

  const risks = [];
  const reasons = [];
  const validationPlan = [];
  if (base.profit <= 0) risks.push('The base case loses money at the entered price and costs.');
  if (base.marginPct < inputs.targetMarginPct) risks.push(`Base margin (${base.marginPct}%) is below the ${inputs.targetMarginPct}% target.`);
  if (scenarios.sourceCostPlus15.profit < 0) risks.push('A 15% sourcing-cost increase makes the product unprofitable.');
  if (scenarios.salePriceMinus10.profit < 0) risks.push('A 10% selling-price reduction makes the product unprofitable.');
  if (scenarios.returnsPlus5.profit < 0) risks.push('A five-point increase in returns/issues makes the product unprofitable.');
  if (scenarios.combinedDownside.profit < 0) risks.push('The combined downside scenario loses money.');
  if (inputs.competitionScore >= 70) risks.push('Competition is entered as high; differentiation and acquisition costs need proof.');
  if (inputs.demandScore < 50) risks.push('Demand evidence is weak or uncertain.');
  if (inputs.supplierConfidence < 60) risks.push('Supplier confidence is below 60/100.');
  if (inputs.evidenceCount < 2) risks.push('Fewer than two independent demand signals have been recorded.');
  if (maxSourceCost < 0) risks.push('The target margin cannot be reached even with a zero source-unit cost.');

  if (base.marginPct >= inputs.targetMarginPct) reasons.push('Base margin meets the entered target.');
  if (base.roiPct >= 50) reasons.push('ROI on landed cost is at least 50% in the base case.');
  if (scenarios.combinedDownside.profit > 0) reasons.push('The combined downside scenario remains profitable.');
  if (inputs.demandScore >= 70) reasons.push('Demand evidence is entered as strong.');
  if (inputs.competitionScore <= 40) reasons.push('Competition is entered as low to moderate.');
  if (inputs.supplierConfidence >= 75) reasons.push('Supplier confidence is entered as strong.');

  validationPlan.push('Confirm current source price, minimum order, shipping, import duties, lead time, defects and return terms in writing.');
  validationPlan.push('Check the target marketplace’s current product, handmade/resale, dropshipping and intellectual-property rules.');
  if (inputs.evidenceCount < 3) validationPlan.push('Collect at least three independent demand signals before buying inventory.');
  if (inputs.competitionScore >= 50) validationPlan.push('Review at least ten competing listings and define a concrete differentiation angle.');
  if (inputs.adReservePct < 5) validationPlan.push('Test whether the product can acquire traffic without exceeding the current advertising reserve.');
  if (scenarios.combinedDownside.profit < 0) validationPlan.push('Negotiate cost, raise price or reduce fees until the combined downside case is non-negative.');
  validationPlan.push('Run a small validation batch or pre-order test before committing meaningful capital.');

  let verdict = 'NO-BUY';
  if (score >= 75 && base.marginPct >= inputs.targetMarginPct && scenarios.combinedDownside.profit >= 0 && inputs.evidenceCount >= 2) verdict = 'GO';
  else if (score >= 52 && base.profit > 0) verdict = 'VALIDATE';
  if (reasons.length === 0) reasons.push('No strong positive signal survives the current assumptions.');
  if (risks.length === 0) risks.push('No automatic red flag was triggered, but the assumptions still require real-world validation.');

  return {
    schema: `${baseUrl}/schemas/decision-passport-v1.json`,
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    passportId: `dm_${crypto.randomBytes(6).toString('hex')}`,
    product: { name: inputs.productName, category: inputs.category, channel: inputs.channel, sourceUrl: inputs.sourceUrl || null },
    inputs,
    metrics: {
      ...base,
      targetMarginPct: inputs.targetMarginPct,
      maxLandedCostAtTargetMargin: round(maxLandedCost),
      maxSourceCostAtTargetMargin: round(maxSourceCost),
      economicsScore: Math.round(economicsScore),
      opportunityScore: score
    },
    scenarios,
    verdict,
    reasons,
    risks,
    validationPlan,
    disclaimer: 'DemandMine is informational decision support. Inputs can be wrong or change. It does not guarantee demand, marketplace approval, sales, supplier performance or profit.'
  };
}

function schema(baseUrl) {
  return {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    '$id': `${baseUrl}/schemas/decision-passport-v1.json`,
    title: 'DemandMine Product Decision Passport', type: 'object',
    required: ['schemaVersion', 'generatedAt', 'passportId', 'product', 'inputs', 'metrics', 'scenarios', 'verdict', 'risks', 'validationPlan'],
    properties: {
      schemaVersion: { type: 'string' }, generatedAt: { type: 'string', format: 'date-time' }, passportId: { type: 'string' },
      product: { type: 'object' }, inputs: { type: 'object' }, metrics: { type: 'object' }, scenarios: { type: 'object' },
      verdict: { enum: ['GO', 'VALIDATE', 'NO-BUY'] }, reasons: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } }, validationPlan: { type: 'array', items: { type: 'string' } }, disclaimer: { type: 'string' }
    }
  };
}

module.exports = { calculate, schema };
