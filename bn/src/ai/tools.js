// Tool definitions for the AI chat. The LLM picks which to call.
// Each handler receives parsed args and a context { cars, orders } and returns
// { result: string, action?: object } where action is shown by the frontend.

export const TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'compare_cars',
      description: 'Compare two or more cars side-by-side by their ids. Use when user asks to compare, vs, or differences between cars.',
      parameters: {
        type: 'object',
        properties: {
          car_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of car ids from the catalog (e.g. ["tata-nexon-ev","hyundai-ioniq5"])',
          },
        },
        required: ['car_ids'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_emi',
      description: 'Calculate monthly EMI for a car loan. Use when user asks about affordability, EMI, monthly payment, financing.',
      parameters: {
        type: 'object',
        properties: {
          car_id: { type: 'string', description: 'Catalog car id, if a specific car was mentioned' },
          price_inr: { type: 'number', description: 'On-road price in INR (use catalog price if car_id given)' },
          down_payment_inr: { type: 'number', description: 'Down payment in INR' },
          annual_rate_pct: { type: 'number', description: 'Annual interest rate in percent (e.g. 9 for 9%). Default 9.' },
          years: { type: 'number', description: 'Loan tenure in years. Default 5.' },
        },
        required: ['down_payment_inr'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_filters',
      description: 'Apply browse filters and direct the user to the filtered catalog. Use when user wants to "show me", "filter by", or browse with constraints.',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          fuel_type: { type: 'string', enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
          body_type: { type: 'string', enum: ['Hatchback', 'SUV', 'Micro SUV', 'MPV', 'Crossover'] },
          max_price_inr: { type: 'number' },
          search: { type: 'string', description: 'Free-text search across brand and model' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_test_drive',
      description: 'Book a test drive after collecting buyer name, email and phone. Only call once you have ALL three.',
      parameters: {
        type: 'object',
        properties: {
          car_id: { type: 'string', description: 'Catalog car id' },
          buyer_name: { type: 'string' },
          buyer_email: { type: 'string' },
          buyer_phone: { type: 'string' },
          preferred_date: { type: 'string', description: 'YYYY-MM-DD or descriptive (e.g. "next Saturday")' },
        },
        required: ['car_id', 'buyer_name', 'buyer_email'],
      },
    },
  },
];

export function makeToolHandlers({ cars, supabase, hasSupabase }) {
  const findCar = (id) => cars.find((c) => c.id === id);

  return {
    compare_cars: ({ car_ids }) => {
      const found = (car_ids || []).map(findCar).filter(Boolean);
      if (found.length < 2) {
        return { result: 'Need at least 2 valid car ids to compare.', action: null };
      }
      return {
        result: `Built comparison for ${found.map((c) => `${c.brand} ${c.model}`).join(' vs ')}.`,
        action: { type: 'comparison', cars: found },
      };
    },

    calculate_emi: ({ car_id, price_inr, down_payment_inr, annual_rate_pct = 9, years = 5 }) => {
      let car = null;
      let price = price_inr;
      if (car_id) {
        car = findCar(car_id);
        if (car) price = car.price_inr;
      }
      if (!price) return { result: 'Need either car_id or price_inr.', action: null };

      const principal = Math.max(0, price - (down_payment_inr || 0));
      const monthlyRate = annual_rate_pct / 100 / 12;
      const months = years * 12;
      const emi = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      const total = emi * months;
      const interest = total - principal;

      return {
        result: `Monthly EMI ≈ ₹${Math.round(emi).toLocaleString('en-IN')} for ${years} years at ${annual_rate_pct}%.`,
        action: {
          type: 'emi',
          car,
          price_inr: price,
          down_payment_inr: down_payment_inr || 0,
          principal_inr: principal,
          annual_rate_pct,
          years,
          months,
          monthly_emi_inr: Math.round(emi),
          total_payable_inr: Math.round(total + (down_payment_inr || 0)),
          total_interest_inr: Math.round(interest),
        },
      };
    },

    apply_filters: (filters) => {
      const clean = Object.fromEntries(
        Object.entries(filters || {}).filter(([, v]) => v != null && v !== '')
      );
      const params = new URLSearchParams();
      if (clean.brand) params.set('brand', clean.brand);
      if (clean.fuel_type) params.set('fuel_type', clean.fuel_type);
      if (clean.body_type) params.set('body_type', clean.body_type);
      if (clean.max_price_inr) params.set('max_price', String(clean.max_price_inr));
      if (clean.search) params.set('search', clean.search);

      const filtered = cars.filter((c) =>
        (!clean.brand || c.brand.toLowerCase().includes(String(clean.brand).toLowerCase())) &&
        (!clean.fuel_type || c.fuel_type === clean.fuel_type) &&
        (!clean.body_type || c.body_type === clean.body_type) &&
        (!clean.max_price_inr || c.price_inr <= clean.max_price_inr)
      );

      return {
        result: `${filtered.length} cars match. Filters: ${JSON.stringify(clean)}`,
        action: {
          type: 'apply_filters',
          filters: clean,
          url: `/?${params.toString()}`,
          match_count: filtered.length,
        },
      };
    },

    book_test_drive: async ({ car_id, buyer_name, buyer_email, buyer_phone, preferred_date }) => {
      const car = findCar(car_id);
      if (!car) return { result: `Unknown car_id: ${car_id}`, action: null };

      let order;
      if (hasSupabase) {
        const { data, error } = await supabase
          .from('orders')
          .insert({ car_id, buyer_name, buyer_email, buyer_phone, status: 'test-drive-requested' })
          .select()
          .single();
        if (error) return { result: `Failed to book: ${error.message}`, action: null };
        order = data;
      } else {
        order = { id: `local-${Date.now()}`, car_id, buyer_name, buyer_email, buyer_phone };
      }

      return {
        result: `Test drive booked for ${buyer_name} (${buyer_email}) for ${car.brand} ${car.model}. Order ${order.id}.`,
        action: {
          type: 'test_drive_booked',
          car,
          order,
          buyer_name,
          buyer_email,
          buyer_phone,
          preferred_date: preferred_date || null,
        },
      };
    },
  };
}
