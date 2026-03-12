import { openDb } from './db';

async function queryGenerations() {
  try {
    const db = await openDb();
    const generations = await db.all('SELECT * FROM generations ORDER BY timestamp DESC LIMIT 3');
    console.log('Last 3 generations:', JSON.stringify(generations, null, 2));
  } catch (error) {
    console.error('Error querying generations:', error);
  }
}

queryGenerations();
