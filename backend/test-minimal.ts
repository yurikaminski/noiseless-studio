import express from 'express';
console.log('express ok');
import { initDb } from './db.js';
console.log('db ok');
await initDb();
console.log('ALL DONE');
process.exit(0);
