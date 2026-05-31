import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import carsRouter from './routes/cars.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || '*',
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Cars AI Platform API',
    status: 'ok',
    endpoints: ['/api/cars', '/api/cars/:id', '/api/ai/chat', '/api/ai/recommend'],
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/cars', carsRouter);
app.use('/api/ai', aiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Cars AI Platform API running on :${PORT}`);
});
