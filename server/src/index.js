import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/todo-app';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
  createApp({ logging: true }).listen(PORT, () => console.log(`API listening on :${PORT}`));
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
