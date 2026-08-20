require('dotenv').config();

const url = process.env.DATABASE_URL || '';
const masked = url.replace(/:[^:@]+@/, ':***@');
console.log('🔗 Original URL:', masked);

// Strip channel_binding=require (can cause issues with some network setups)
const cleanUrl = url
  .replace('&channel_binding=require', '')
  .replace('?channel_binding=require&', '?')
  .replace('?channel_binding=require', '');

const cleanMasked = cleanUrl.replace(/:[^:@]+@/, ':***@');
console.log('🧪 Clean URL:', cleanMasked);

// Temporarily override DATABASE_URL for this test
process.env.DATABASE_URL = cleanUrl;

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error'] });

p.$queryRawUnsafe('SELECT 1 as result')
  .then((r) => {
    console.log('✅ DB connection OK:', r);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error('❌ DB connection FAILED:', e.message);
    p.$disconnect().catch(() => {});
    process.exit(1);
  });
