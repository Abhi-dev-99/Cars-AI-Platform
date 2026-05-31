-- Cars AI Platform — seed 12 Indian cars
-- Run AFTER supabase-schema.sql in the Supabase SQL editor.
-- Safe to re-run (uses ON CONFLICT).

insert into cars (id, brand, model, year, price_inr, fuel_type, transmission, mileage_kmpl, range_km, seats, body_type, color, location, image_url, description, features, available)
values
  (
    'maruti-swift-vxi', 'Maruti Suzuki', 'Swift VXI', 2024, 699000,
    'Petrol', 'Manual', 22.4, null, 5, 'Hatchback',
    'Pearl Arctic White', 'Bengaluru',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
    'India''s best-selling hatchback, fuel-efficient and easy to maintain. Ideal for city driving.',
    jsonb_build_array('Touchscreen Infotainment','Apple CarPlay','Dual Airbags','ABS with EBD','Power Steering'),
    true
  ),
  (
    'tata-nexon-ev', 'Tata', 'Nexon EV Max', 2024, 1649000,
    'Electric', 'Automatic', null, 437, 5, 'SUV',
    'Intensi-Teal', 'Mumbai',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    'India''s most popular electric SUV with a 437 km range. Fast charging and 5-star safety rating.',
    jsonb_build_array('40.5 kWh Battery','Fast Charging','5-star NCAP Safety','Sunroof','Connected Car Tech'),
    true
  ),
  (
    'mahindra-thar', 'Mahindra', 'Thar LX 4WD', 2024, 1699000,
    'Diesel', 'Manual', 15.2, null, 4, 'SUV',
    'Napoli Black', 'Delhi',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
    'Iconic off-road SUV with 4-wheel drive. Built for adventure and rugged terrain.',
    jsonb_build_array('4WD','Removable Hard Top','Off-Road Capable','Touchscreen','Cruise Control'),
    true
  ),
  (
    'hyundai-creta', 'Hyundai', 'Creta SX', 2024, 1599000,
    'Petrol', 'Automatic', 17.7, null, 5, 'SUV',
    'Polar White', 'Hyderabad',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    'Premium compact SUV with panoramic sunroof, ventilated seats and ADAS features.',
    jsonb_build_array('Panoramic Sunroof','Ventilated Seats','ADAS Level 2','Bose Audio','6 Airbags'),
    true
  ),
  (
    'kia-seltos', 'Kia', 'Seltos GTX+', 2024, 1799000,
    'Petrol', 'Automatic', 17.0, null, 5, 'SUV',
    'Intelligency Blue', 'Chennai',
    'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=800',
    'Stylish SUV with 1.4L turbo petrol engine, premium interiors and class-leading tech.',
    jsonb_build_array('1.4L Turbo','Heads-Up Display','360° Camera','Bose 8-Speaker','Wireless Charging'),
    true
  ),
  (
    'tata-punch', 'Tata', 'Punch Creative', 2024, 749000,
    'Petrol', 'Manual', 20.1, null, 5, 'Micro SUV',
    'Tropical Mist', 'Pune',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    'Compact SUV with high ground clearance and 5-star Global NCAP safety rating.',
    jsonb_build_array('5-star Safety','High Ground Clearance','Touchscreen','Cruise Control','Rear Camera'),
    true
  ),
  (
    'mahindra-xuv700', 'Mahindra', 'XUV700 AX7', 2024, 2499000,
    'Diesel', 'Automatic', 16.5, null, 7, 'SUV',
    'Everest White', 'Ahmedabad',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
    'Flagship 7-seater SUV with ADAS, AdrenoX connected tech and panoramic sunroof.',
    jsonb_build_array('ADAS Level 2','7 Seats','Panoramic Sunroof','12-Speaker Sony','AdrenoX Tech'),
    true
  ),
  (
    'maruti-baleno', 'Maruti Suzuki', 'Baleno Alpha', 2024, 999000,
    'Petrol', 'Automatic', 22.9, null, 5, 'Hatchback',
    'Nexa Blue', 'Kolkata',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
    'Premium hatchback with HUD, 360° camera and 9-inch SmartPlay Pro+ infotainment.',
    jsonb_build_array('Heads-Up Display','360° Camera','6 Airbags','Wireless Apple CarPlay','Cruise Control'),
    true
  ),
  (
    'hyundai-ioniq5', 'Hyundai', 'Ioniq 5', 2024, 4598000,
    'Electric', 'Automatic', null, 631, 5, 'Crossover',
    'Gravity Gold', 'Bengaluru',
    'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800',
    'Premium electric crossover with 631 km range, ultra-fast 350 kW charging.',
    jsonb_build_array('72.6 kWh Battery','V2L Charging','AR HUD','Bose Premium Audio','ADAS Level 2'),
    true
  ),
  (
    'toyota-innova-hycross', 'Toyota', 'Innova Hycross ZX', 2024, 2999000,
    'Hybrid', 'Automatic', 21.1, null, 7, 'MPV',
    'Platinum White Pearl', 'Mumbai',
    'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800',
    'Premium hybrid MPV with captain seats, ottoman recline and Toyota Safety Sense.',
    jsonb_build_array('Strong Hybrid','Captain Seats','Ottoman Recline','Toyota Safety Sense','9 Airbags'),
    true
  ),
  (
    'tata-harrier', 'Tata', 'Harrier Fearless+', 2024, 2399000,
    'Diesel', 'Automatic', 16.8, null, 5, 'SUV',
    'Sunlit Yellow', 'Delhi',
    'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800',
    'Flagship SUV with 12.3-inch infotainment, JBL audio and Level 2 ADAS.',
    jsonb_build_array('12.3-inch Infotainment','JBL 10-Speaker','ADAS Level 2','Air Purifier','7 Airbags'),
    true
  ),
  (
    'maruti-grand-vitara', 'Maruti Suzuki', 'Grand Vitara Alpha+', 2024, 1999000,
    'Hybrid', 'Automatic', 27.97, null, 5, 'SUV',
    'Splendid Silver', 'Jaipur',
    'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800',
    'Strong hybrid SUV with India''s best mileage at 27.97 kmpl. Premium features.',
    jsonb_build_array('Strong Hybrid','Panoramic Sunroof','AWD AllGrip','Heads-Up Display','360° Camera'),
    true
  )
on conflict (id) do update set
  brand = excluded.brand,
  model = excluded.model,
  year = excluded.year,
  price_inr = excluded.price_inr,
  fuel_type = excluded.fuel_type,
  transmission = excluded.transmission,
  mileage_kmpl = excluded.mileage_kmpl,
  range_km = excluded.range_km,
  seats = excluded.seats,
  body_type = excluded.body_type,
  color = excluded.color,
  location = excluded.location,
  image_url = excluded.image_url,
  description = excluded.description,
  features = excluded.features,
  available = excluded.available;

select count(*) as total_cars from cars;
