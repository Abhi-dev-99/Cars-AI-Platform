import { Router } from 'express';
import { supabase, hasSupabase } from '../db/supabase.js';
import { INDIAN_CARS } from '../data/cars.js';
import { TOOL_DEFS, makeToolHandlers } from '../ai/tools.js';

const router = Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview';
const hasLLM = Boolean(GROQ_API_KEY);

async function loadCars() {
  if (hasSupabase) {
    const { data } = await supabase.from('cars').select('*').eq('available', true);
    return data || [];
  }
  return INDIAN_CARS.filter((c) => c.available);
}

function carCatalogContext(cars) {
  return cars.map((c) => {
    const priceL = (c.price_inr / 100000).toFixed(2);
    const mileage = c.mileage_kmpl ? `${c.mileage_kmpl} kmpl` : c.range_km ? `${c.range_km} km range` : '';
    return `- id:${c.id} | ${c.brand} ${c.model} (${c.year}) | ₹${priceL}L | ${c.fuel_type} ${c.transmission} | ${c.body_type} ${c.seats}-seater | ${mileage} | ${c.location}`;
  }).join('\n');
}

async function callGroq(payload) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    const cars = await loadCars();

    if (!hasLLM) {
      return res.json(ruleBasedReply(message, cars));
    }

    const system = `You are an expert AI assistant for Cars AI Platform, an Indian car marketplace.

CATALOG (use these EXACT cars only — never invent cars):
${carCatalogContext(cars)}

You have powerful tools — USE THEM proactively:
- compare_cars: when user wants to compare 2+ cars
- calculate_emi: for affordability, EMI, monthly payment questions
- apply_filters: when user wants to browse with constraints (use this instead of just listing)
- book_test_drive: collect buyer name, email, phone conversationally, THEN call this

Rules:
- Prices in INR. 1 Lakh = ₹100,000. 1 Crore = ₹10,000,000.
- After calling a tool, write a short friendly reply (1-2 sentences) summarizing what you did.
- Mention specific cars from the catalog by name.
- Be concise. No fluff.`;

    const handlers = makeToolHandlers({ cars, supabase, hasSupabase });
    const messages = [
      { role: 'system', content: system },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text || m.content || '',
      })),
      { role: 'user', content: message },
    ];

    const actions = [];
    const suggestions = [];
    let finalReply = '';

    // Multi-turn tool calling, capped to 4 iterations
    for (let i = 0; i < 4; i++) {
      const data = await callGroq({
        model: GROQ_MODEL,
        messages,
        tools: TOOL_DEFS,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 700,
      });

      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      messages.push(msg);

      if (msg.tool_calls?.length) {
        for (const call of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch {}
          const handler = handlers[call.function.name];
          let toolResult;
          try {
            toolResult = handler ? await handler(args) : { result: `Unknown tool: ${call.function.name}` };
          } catch (e) {
            toolResult = { result: `Tool error: ${e.message}` };
          }
          if (toolResult.action) actions.push(toolResult.action);
          if (toolResult.action?.cars) suggestions.push(...toolResult.action.cars);
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: toolResult.result,
          });
        }
        continue;
      }

      finalReply = msg.content || '';
      break;
    }

    res.json({
      reply: finalReply,
      suggestions: dedupe(suggestions),
      actions,
      provider: 'groq',
      model: GROQ_MODEL,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/vision', async (req, res, next) => {
  try {
    if (!hasLLM) return res.status(400).json({ error: 'GROQ_API_KEY not configured' });
    const { image_url, image_base64, prompt } = req.body || {};
    if (!image_url && !image_base64) {
      return res.status(400).json({ error: 'image_url or image_base64 required' });
    }

    const cars = await loadCars();
    const dataUrl = image_url || `data:image/jpeg;base64,${image_base64}`;

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${prompt || 'Identify this car. What is the brand, model, body type, and any distinctive features?'}

Then, from this catalog, pick the SINGLE closest matching car id (or "none" if no match):
${cars.map((c) => `- ${c.id}: ${c.brand} ${c.model}`).join('\n')}

Reply in JSON only:
{"brand":"...","model":"...","body_type":"...","features":"...","matched_id":"..."}`,
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ];

    const data = await callGroq({
      model: GROQ_VISION_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const raw = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
    const matched = parsed.matched_id && parsed.matched_id !== 'none'
      ? cars.find((c) => c.id === parsed.matched_id)
      : null;

    res.json({
      identification: parsed,
      matched_car: matched,
      provider: 'groq',
      model: GROQ_VISION_MODEL,
    });
  } catch (err) {
    next(err);
  }
});

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

function buildReasoning({ budget, fuel_type, body_type, seats, prefer_mileage }) {
  const parts = [];
  if (budget) parts.push(`budget under ₹${(budget / 100000).toFixed(1)} lakh`);
  if (fuel_type) parts.push(`${fuel_type.toLowerCase()} fuel type`);
  if (body_type) parts.push(`${body_type} body style`);
  if (seats) parts.push(`at least ${seats} seats`);
  if (prefer_mileage) parts.push('high mileage preference');
  return parts.length ? `Ranked by ${parts.join(', ')}.` : 'Showing top picks from our catalog.';
}

function dedupe(cars) {
  const seen = new Set();
  return cars.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function ruleBasedReply(message, cars) {
  const lower = message.toLowerCase();
  const matches = cars.filter((c) =>
    lower.includes(c.brand.toLowerCase()) ||
    lower.includes(c.model.toLowerCase().split(' ')[0]) ||
    (lower.includes('electric') && c.fuel_type === 'Electric') ||
    (lower.includes('diesel') && c.fuel_type === 'Diesel') ||
    (lower.includes('petrol') && c.fuel_type === 'Petrol') ||
    (lower.includes('hybrid') && c.fuel_type === 'Hybrid') ||
    (lower.includes('suv') && c.body_type.includes('SUV')) ||
    (lower.includes('hatchback') && c.body_type === 'Hatchback')
  );
  const m = message.match(/(?:under|below|less than|upto|up to|around)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore)?/i);
  let budget = null;
  if (m) {
    let amount = parseFloat(m[1]);
    const unit = (m[2] || '').toLowerCase();
    if (unit.startsWith('lak') || unit.startsWith('lac')) amount *= 100000;
    else if (unit.startsWith('cr')) amount *= 10000000;
    budget = amount;
  }
  let suggestions = (matches.length ? matches : cars).slice(0, 3);
  if (budget) suggestions = suggestions.filter((c) => c.price_inr <= budget).slice(0, 3);
  const reply = suggestions.length
    ? `Found ${suggestions.length} car${suggestions.length > 1 ? 's' : ''}: ${suggestions.map((c) => `${c.brand} ${c.model} (₹${(c.price_inr / 100000).toFixed(2)}L)`).join(', ')}.`
    : `Try asking about a brand or budget like "SUV under 15 lakh".`;
  return { reply, suggestions, actions: [], provider: 'rule-based' };
}

export default router;
