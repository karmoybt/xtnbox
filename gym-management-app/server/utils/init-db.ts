import { getDb } from './db';
import fs from 'fs';

export async function initDb() {
  const db = getDb();
  
  try {
    // Read the schema from the SQL file
    const schema = fs.readFileSync('/workspace/gym-management-app/server/utils/schema.sql', 'utf-8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement.trim());
      }
    }
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}