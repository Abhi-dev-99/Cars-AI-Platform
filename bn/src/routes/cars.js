import { Router } from 'express';
import { supabase, hasSupabase } from '../db/supabase.js';
import { INDIAN_CARS } from '../data/cars.js';

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireAdmin(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin disabled: set ADMIN_PASSWORD on the server.' });
  }
  const pw = req.headers['x-admin-password'];
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }
  next();
}

const ALLOWED_FIELDS = [
  'id', 'brand', 'model', 'year', 'price_inr', 'fuel_type', 'transmission',
  'mileage_kmpl', 'range_km', 'seats', 'body_type', 'color', 'location',
  'image_url', 'description', 'features', 'available',
];

function pickFields(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (out.features && typeof out.features === 'string') {
    out.features = out.features.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

router.get('/', async (req, res, next) => {
  try {
    const { brand, fuel_type, body_type, min_price, max_price, search } = req.query;

    if (hasSupabase) {
      let query = supabase.from('cars').select('*').eq('available', true);
      if (brand) query = query.ilike('brand', `%${brand}%`);
      if (fuel_type) query = query.eq('fuel_type', fuel_type);
      if (body_type) query = query.eq('body_type', body_type);
      if (min_price) query = query.gte('price_inr', Number(min_price));
      if (max_price) query = query.lte('price_inr', Number(max_price));
      if (search) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
      const { data, error } = await query.order('price_inr', { ascending: true });
      if (error) throw error;
      return res.json({ cars: data, source: 'supabase' });
    }

    let cars = INDIAN_CARS.filter((c) => c.available);
    if (brand) cars = cars.filter((c) => c.brand.toLowerCase().includes(brand.toLowerCase()));
    if (fuel_type) cars = cars.filter((c) => c.fuel_type === fuel_type);
    if (body_type) cars = cars.filter((c) => c.body_type === body_type);
    if (min_price) cars = cars.filter((c) => c.price_inr >= Number(min_price));
    if (max_price) cars = cars.filter((c) => c.price_inr <= Number(max_price));
    if (search) {
      const s = search.toLowerCase();
      cars = cars.filter((c) => c.brand.toLowerCase().includes(s) || c.model.toLowerCase().includes(s));
    }
    res.json({ cars, source: 'memory' });
  } catch (err) {
    next(err);
  }
});

router.get('/filters', async (_req, res, next) => {
  try {
    const source = hasSupabase ? (await supabase.from('cars').select('*')).data || [] : INDIAN_CARS;
    const unique = (key) => [...new Set(source.map((c) => c[key]).filter(Boolean))].sort();
    res.json({
      brands: unique('brand'),
      fuel_types: unique('fuel_type'),
      body_types: unique('body_type'),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (hasSupabase) {
      const { data, error } = await supabase.from('cars').select('*').eq('id', req.params.id).single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Car not found' });
      return res.json({ car: data });
    }
    const car = INDIAN_CARS.find((c) => c.id === req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json({ car });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/buy', async (req, res, next) => {
  try {
    const { buyer_name, buyer_email, buyer_phone } = req.body || {};
    if (!buyer_name || !buyer_email) {
      return res.status(400).json({ error: 'buyer_name and buyer_email are required' });
    }

    if (hasSupabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert({ car_id: req.params.id, buyer_name, buyer_email, buyer_phone })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ order: data, message: 'Order placed. Dealer will contact you shortly.' });
    }

    res.status(201).json({
      order: { id: `local-${Date.now()}`, car_id: req.params.id, buyer_name, buyer_email, buyer_phone },
      message: 'Order recorded locally (no DB). Dealer will contact you shortly.',
    });
  } catch (err) {
    next(err);
  }
});

// === Admin (Knowledge Base) CRUD ===

function computeDiff(before, after) {
  const diff = {};
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of keys) {
    if (k === 'created_at') continue;
    const a = before?.[k];
    const b = after?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff[k] = { before: a ?? null, after: b ?? null };
    }
  }
  return diff;
}

async function logChange({ car_id, action, diff = {}, snapshot = null }) {
  if (!hasSupabase) return;
  try {
    await supabase.from('car_audit_log').insert({ car_id, action, diff, snapshot });
  } catch (e) {
    console.error('[audit] failed to log change:', e.message);
  }
}

router.get('/admin/recent', requireAdmin, async (_req, res, next) => {
  try {
    if (!hasSupabase) return res.json({ entries: [] });
    const { data, error } = await supabase
      .from('car_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    res.json({ entries: data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/history', requireAdmin, async (req, res, next) => {
  try {
    if (!hasSupabase) return res.json({ entries: [] });
    const { data, error } = await supabase
      .from('car_audit_log')
      .select('*')
      .eq('car_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ entries: data });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    if (hasSupabase) {
      const { data, error } = await supabase.from('cars').select('*').order('brand');
      if (error) throw error;
      return res.json({ cars: data });
    }
    res.json({ cars: INDIAN_CARS });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const payload = pickFields(req.body || {});
    if (!payload.id) payload.id = `${slugify(payload.brand || '')}-${slugify(payload.model || '')}-${Date.now().toString(36)}`;
    if (!payload.brand || !payload.model || !payload.price_inr) {
      return res.status(400).json({ error: 'brand, model and price_inr are required' });
    }
    if (payload.available === undefined) payload.available = true;

    if (hasSupabase) {
      const { data, error } = await supabase.from('cars').insert(payload).select().single();
      if (error) throw error;
      await logChange({ car_id: data.id, action: 'create', snapshot: data });
      return res.status(201).json({ car: data });
    }
    INDIAN_CARS.push(payload);
    res.status(201).json({ car: payload });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const updates = pickFields(req.body || {});
    delete updates.id;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (hasSupabase) {
      const { data: before } = await supabase.from('cars').select('*').eq('id', req.params.id).single();
      const { data: after, error } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      if (!after) return res.status(404).json({ error: 'Car not found' });
      const diff = computeDiff(before, after);
      if (Object.keys(diff).length > 0) {
        await logChange({ car_id: after.id, action: 'update', diff });
      }
      return res.json({ car: after, diff });
    }
    const idx = INDIAN_CARS.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Car not found' });
    const before = { ...INDIAN_CARS[idx] };
    INDIAN_CARS[idx] = { ...before, ...updates };
    const diff = computeDiff(before, INDIAN_CARS[idx]);
    res.json({ car: INDIAN_CARS[idx], diff });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (hasSupabase) {
      const { data: before } = await supabase.from('cars').select('*').eq('id', req.params.id).single();
      const { error } = await supabase.from('cars').delete().eq('id', req.params.id);
      if (error) throw error;
      if (before) await logChange({ car_id: req.params.id, action: 'delete', snapshot: before });
      return res.json({ ok: true });
    }
    const idx = INDIAN_CARS.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Car not found' });
    INDIAN_CARS.splice(idx, 1);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
