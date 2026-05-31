import { supabase, hasSupabase } from '../db/supabase.js';
import { INDIAN_CARS } from './cars.js';

async function seed() {
  if (!hasSupabase) {
    console.error('Supabase env vars not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  console.log(`Seeding ${INDIAN_CARS.length} cars to Supabase...`);
  const { data, error } = await supabase.from('cars').upsert(INDIAN_CARS, { onConflict: 'id' }).select();
  if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
  console.log(`Seeded ${data.length} cars.`);
}

seed();
