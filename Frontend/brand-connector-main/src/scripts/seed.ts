/**
 * @fileOverview CLI Script to trigger Firestore seeding
 */

import { seedFirestore } from '../lib/mockData';

async function main() {
  console.log('--- Baalvion Seeding Script ---');
  try {
    await seedFirestore();
    process.exit(0);
  } catch (err) {
    console.error('Fatal Seeding Error:', err);
    process.exit(1);
  }
}

main();
