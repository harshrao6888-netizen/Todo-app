import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';

const router = Router();
const EDITABLE = ['title', 'description', 'startAt', 'endAt', 'priority', 'status'];

const pick = (body) =>
  Object.fromEntries(EDITABLE.filter((k) => k in body).map((k) => [k, body[k]]));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new HttpError(400, 'Invalid task id'));
  next();
}

function parseDate(value, name) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `Invalid ${name} date`);
  return d;
}

// GET /api/tasks?from=ISO&to=ISO  -> tasks with startAt in [from, to)
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.from || req.query.to) {
    filter.startAt = {};
    if (req.query.from) filter.startAt.$gte = parseDate(req.query.from, 'from');
    if (req.query.to) filter.startAt.$lt = parseDate(req.query.to, 'to');
  }
  res.json(await Task.find(filter).sort({ startAt: 1, createdAt: 1 }));
});

// GET /api/tasks/search?q=keyword  -> keyword match on title or description
router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.json([]);
  const rx = new RegExp(escapeRegex(q), 'i');
  res.json(await Task.find({ $or: [{ title: rx }, { description: rx }] }).sort({ startAt: 1 }));
});

router.get('/:id', validId, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
});

router.post('/', async (req, res) => {
  const task = await Task.create(pick(req.body));
  res.status(201).json(task);
});

router.patch('/:id', validId, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  task.set(pick(req.body));
  await task.save(); // runs full-document validation (incl. endAt >= startAt)
  res.json(task);
});

router.delete('/:id', validId, async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.status(204).end();
});

export { HttpError };
export default router;
