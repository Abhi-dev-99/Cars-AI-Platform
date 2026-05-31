import { Router } from 'express';
import { supabase, hasSupabase } from '../db/supabase.js';
import { INDIAN_CARS } from '../data/cars.js';

const router = Router();

async function loadCars() {
  if (hasSupabase) {
    const { data } = await supabase.from('cars').select('*').eq('available', true);
    return data || [];
  }
  return INDIAN_CARS.filter((c) => c.available);
}

router.post('/recommend', async (req, res, next) => {
  try {
    const { budget, fuel_type, body_type, seats, prefer_mileage } = req.body || {};
    const cars = await loadCars();

    const scored = cars.map((c) => {
      let score = 0;
      if (budget && c.price_inr <= Number(budget)) score += 40;
      else if (budget) score -= Math.min(40, ((c.price_inr - budget) / budget) * 40);
      if (fuel_type && c.fuel_type === fuel_type) score += 25;
      if (body_type && c.body_type === body_type) score += 20;
      if (seats && c.seats >= Number(seats)) score += 10;
      if (prefer_mileage && c.mileage_kmpl) score += Math.min(15, c.mileage_kmpl / 2);
      return { car: c, score };
    });

    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ car, score }) => ({ ...car, match_score: Math.round(score) }));

    res.json({
      recommendations,
      reasoning: buildReasoning({ budget, fuel_type, body_type, seats, prefer_mileage }),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    const cars = await loadCars();
    const lower = message.toLowerCase();

    const matches = cars.filter((c) =>
      lower.includes(c.brand.toLowerCase()) ||
      lower.includes(c.model.toLowerCase().split(' ')[0]) ||
      (lower.includes('electric') && c.fuel_type === 'Electric') ||
      (lower.includes('diesel') && c.fuel_type === 'Diesel') ||
      (lower.includes('petrol') && c.fuel_type === 'Petrol') ||
      (lower.includes('hybrid') && c.fuel_type === 'Hybrid') ||
      (lower.includes('suv') && c.body_type.includes('SUV')) ||
      (lower.includes('hatchback') && c.body_type === 'Hatchback') ||
      (lower.includes('7 seat') && c.seats >= 7)
    );

    let budgetMatch = null;
    const budgetRe = /(?:under|below|less than|upto|up to|around)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore)?/i;
    const m = message.match(budgetRe);
    if (m) {
      let amount = parseFloat(m[1]);
      const unit = (m[2] || '').toLowerCase();
      if (unit.startsWith('lak') || unit.startsWith('lac')) amount *= 100000;
      else if (unit.startsWith('cr')) amount *= 10000000;
      budgetMatch = amount;
    }

    let suggestions = matches.length ? matches : cars;
    if (budgetMatch) suggestions = suggestions.filter((c) => c.price_inr <= budgetMatch);
    suggestions = suggestions.slice(0, 3);

    const reply = suggestions.length
      ? `I found ${suggestions.length} car${suggestions.length > 1 ? 's' : ''} matching your query${budgetMatch ? ` under ₹${(budgetMatch / 100000).toFixed(1)} lakh` : ''}. ${suggestions.map((c) => `${c.brand} ${c.model} (₹${(c.price_inr / 100000).toFixed(2)}L)`).join(', ')}.`
      : `I couldn\'t find an exact match. Try asking about brands like Maruti, Tata, Hyundai, or specify a budget like "under 10 lakh".`;

    res.json({ reply, suggestions });
  } catch (err) {
    next(err);
  }
});

function buildReasoning({ budget, fuel_type, body_type, seats, prefer_mileage }) {
  const parts = [];
  if (budget) parts.push(`budget under ₹${(budget / 100000).toFixed(1)} lakh`);
  if (fuel_type) parts.push(`${fuel_type.toLowerCase()} fuel type`);
  if (body_type) parts.push(`${body_type} body style`);
  if (seats) parts.push(`at least ${seats} seats`);
  if (prefer_mileage) parts.push('high mileage preference');
  return parts.length ? `Ranked by ${parts.join(', ')}.` : 'Showing top picks from our catalog.';
}

export default router;
