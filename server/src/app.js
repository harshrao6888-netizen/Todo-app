import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import tasksRouter from './routes/tasks.js';

export function createApp({ corsOrigin = process.env.CORS_ORIGIN, logging = false } = {}) {
  const app = express();

  app.use(
    cors({
      // Comma-separated list of allowed origins; unset = allow all (dev).
      origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  if (logging) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
  );
  app.use('/api/tasks', tasksRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Express 5 forwards rejected async handlers here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors).map((e) =>
        e instanceof mongoose.Error.CastError ? `Invalid ${e.path}` : e.message
      );
      return res.status(400).json({ error: message.join('; ') });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: `Invalid ${err.path}` });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
