import { getDb } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();
    
    // Parse query parameters
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Build the query with filtering and pagination
    let sql = 'SELECT * FROM users WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (query.email) {
      sql += ' AND email = ?';
      params.push(query.email);
    }
    
    if (query.phone) {
      sql += ' AND phone = ?';
      params.push(query.phone);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await db.execute(sql, params);
    
    return {
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.rows.length // In a real implementation, you'd need a separate count query
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error.message
    };
  }
});