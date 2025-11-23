import { getDb } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }
    
    // Check if user with email already exists
    const checkSql = 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL';
    const checkResult = await db.execute(checkSql, [body.email]);
    
    if (checkResult.rows.length > 0) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }
    
    // Insert the new user
    const sql = `
      INSERT INTO users (email, phone, locale, timezone) 
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      body.email,
      body.phone || null,
      body.locale || 'en',
      body.timezone || 'UTC'
    ];
    
    const result = await db.execute(sql, params);
    
    return {
      success: true,
      message: 'User created successfully',
      userId: result.meta.lastInsertId
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error.message
    };
  }
});