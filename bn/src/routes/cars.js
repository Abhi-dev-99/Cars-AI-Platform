import { Router } from 'express';
import { supabase, hasSupabase } from '../db/supabase.js';
import { INDIAN_CARS } from '../data/cars.js';

const router = Router();

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

export default router;
