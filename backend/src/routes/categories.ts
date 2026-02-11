import { Router } from 'express';
import { getDatabase } from '../database/db';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Get all categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      'SELECT * FROM categories ORDER BY sort_order ASC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Get categories error:', err);
          return res.status(500).json({ success: false, error: 'Failed to get categories' });
        }
        res.json({ success: true, data: rows });
      }
    );
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Create category (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, name, icon, sort_order } = req.body;
    const db = getDatabase();
    
    db.run(
      'INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
      [id, name, icon, sort_order || 0],
      (err) => {
        if (err) {
          console.error('Create category error:', err);
          return res.status(500).json({ success: false, error: 'Failed to create category' });
        }
        res.json({ success: true, message: 'Category created' });
      }
    );
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// Update category (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, icon, sort_order } = req.body;
    const db = getDatabase();
    
    db.run(
      'UPDATE categories SET name = ?, icon = ?, sort_order = ? WHERE id = ?',
      [name, icon, sort_order, req.params.id],
      (err) => {
        if (err) {
          console.error('Update category error:', err);
          return res.status(500).json({ success: false, error: 'Failed to update category' });
        }
        res.json({ success: true, message: 'Category updated' });
      }
    );
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    
    db.run(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) {
          console.error('Delete category error:', err);
          return res.status(500).json({ success: false, error: 'Failed to delete category' });
        }
        res.json({ success: true, message: 'Category deleted' });
      }
    );
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

export default router;
