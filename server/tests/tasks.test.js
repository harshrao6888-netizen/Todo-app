import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import Task from '../src/models/Task.js';

let mongo;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

const base = { title: 'Finishing Wireframe', startAt: '2026-11-12T10:00:00.000Z' };

describe('POST /api/tasks', () => {
  it('creates a task with only the mandatory fields', async () => {
    const res = await request(app).post('/api/tasks').send(base);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Finishing Wireframe');
    expect(res.body.status).toBe('in_progress');
    expect(res.body.priority).toBeNull();
    expect(res.body.description).toBe('');
    expect(res.body._id).toBeDefined();
  });

  it('creates a task with every field', async () => {
    const res = await request(app).post('/api/tasks').send({
      ...base,
      description: 'Home + search screens',
      endAt: '2026-11-12T12:00:00.000Z',
      priority: 'high',
    });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('high');
    expect(res.body.endAt).toBe('2026-11-12T12:00:00.000Z');
  });

  it('rejects a missing title', async () => {
    const res = await request(app).post('/api/tasks').send({ startAt: base.startAt });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('rejects a whitespace-only title', async () => {
    const res = await request(app).post('/api/tasks').send({ ...base, title: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects a missing date & time', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/date/i);
  });

  it('rejects an invalid priority', async () => {
    const res = await request(app).post('/api/tasks').send({ ...base, priority: 'urgent' });
    expect(res.status).toBe(400);
  });

  it('rejects an end time before the start time', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ ...base, endAt: '2026-11-12T09:00:00.000Z' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/end/i);
  });
});

describe('GET /api/tasks', () => {
  it('lists tasks sorted by start time', async () => {
    await Task.create({ title: 'B', startAt: '2026-11-13T10:00:00Z' });
    await Task.create({ title: 'A', startAt: '2026-11-11T10:00:00Z' });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['A', 'B']);
  });

  it('filters by from/to range', async () => {
    await Task.create({ title: 'in', startAt: '2026-11-12T10:00:00Z' });
    await Task.create({ title: 'out', startAt: '2026-11-20T10:00:00Z' });
    const res = await request(app).get(
      '/api/tasks?from=2026-11-09T00:00:00Z&to=2026-11-16T00:00:00Z'
    );
    expect(res.body.map((t) => t.title)).toEqual(['in']);
  });
});

describe('GET /api/tasks/search', () => {
  beforeEach(async () => {
    await Task.create({ title: 'Finishing Wireframe', startAt: base.startAt });
    await Task.create({ title: 'Meeting', description: 'finish the agenda', startAt: base.startAt });
    await Task.create({ title: 'Buy cat food', startAt: base.startAt });
  });

  it('matches title and description, case-insensitively', async () => {
    const res = await request(app).get('/api/tasks/search?q=FINISH');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title).sort()).toEqual(['Finishing Wireframe', 'Meeting']);
  });

  it('treats regex characters literally', async () => {
    const res = await request(app).get('/api/tasks/search?q=.*');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns an empty list for an empty query', async () => {
    const res = await request(app).get('/api/tasks/search?q=');
    expect(res.body).toEqual([]);
  });
});

describe('GET/PATCH/DELETE /api/tasks/:id', () => {
  it('gets one task', async () => {
    const t = await Task.create(base);
    const res = await request(app).get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(base.title);
  });

  it('returns 404 for an unknown id and 400 for a malformed id', async () => {
    expect((await request(app).get(`/api/tasks/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
    expect((await request(app).get('/api/tasks/not-an-id')).status).toBe(400);
  });

  it('edits any attribute', async () => {
    const t = await Task.create(base);
    const res = await request(app).patch(`/api/tasks/${t._id}`).send({
      title: 'New',
      description: 'd',
      startAt: '2026-11-14T08:00:00.000Z',
      priority: 'low',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: 'New',
      description: 'd',
      startAt: '2026-11-14T08:00:00.000Z',
      priority: 'low',
    });
  });

  it('marks a task completed and back to in progress', async () => {
    const t = await Task.create(base);
    let res = await request(app).patch(`/api/tasks/${t._id}`).send({ status: 'completed' });
    expect(res.body.status).toBe('completed');
    res = await request(app).patch(`/api/tasks/${t._id}`).send({ status: 'in_progress' });
    expect(res.body.status).toBe('in_progress');
  });

  it('clears priority when set to null', async () => {
    const t = await Task.create({ ...base, priority: 'high' });
    const res = await request(app).patch(`/api/tasks/${t._id}`).send({ priority: null });
    expect(res.body.priority).toBeNull();
  });

  it('validates on edit', async () => {
    const t = await Task.create(base);
    expect((await request(app).patch(`/api/tasks/${t._id}`).send({ title: '' })).status).toBe(400);
    expect((await request(app).patch(`/api/tasks/${t._id}`).send({ status: 'done' })).status).toBe(400);
    expect(
      (await request(app).patch(`/api/tasks/${t._id}`).send({ endAt: '2026-11-12T09:00:00.000Z' })).status
    ).toBe(400);
  });

  it('deletes a task', async () => {
    const t = await Task.create(base);
    const res = await request(app).delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(204);
    expect(await Task.findById(t._id)).toBeNull();
    expect((await request(app).delete(`/api/tasks/${t._id}`)).status).toBe(404);
  });
});

describe('health', () => {
  it('responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
