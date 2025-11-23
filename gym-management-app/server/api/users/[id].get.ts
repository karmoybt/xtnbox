import { getDb } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const db = getDb();
    const id = parseInt(event.context.params.id);
    
    if (isNaN(id)) {
      return {
        success: false,
        error: 'Invalid user ID'
      };
    }
    
    const sql = 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL';
    const result = await db.execute(sql, [id]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: error.message
    };
  }
});