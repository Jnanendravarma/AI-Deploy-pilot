// Script to seed local MongoDB with baseline configurations
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deploypilot';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Seeded database entries successfully!');
  await mongoose.disconnect();
}

seed().catch(console.error);
