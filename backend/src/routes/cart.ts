import { Router } from 'express';
import { getDatabase } from '../database/db';
import { verifyTelegramAuth } from '../middleware/auth';

const router = Router();

// Get user's cart
router.get('/my', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  
  db.all(
    `SELECT c.*, p.* FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      const cartItems = rows.map((row: any) => ({
        id: row.id.toString(),
        product: {
          id: row.product_id,
          name: row.name,
          price: row.price,
          image: row.image,
          category: row.category_id,
          description: row.description,
        },
        quantity: row.quantity,
        selectedSize: row.selected_size ? JSON.parse(row.selected_size) : undefined,
        selectedColor: row.selected_color ? JSON.parse(row.selected_color) : undefined,
        customMessage: row.custom_message,
      }));
      
      res.json({ success: true, data: cartItems });
    }
  );
});

// Add item to cart
router.post('/', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  const { productId, quantity, selectedSize, selectedColor, customMessage } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ success: false, error: 'Product ID and quantity are required' });
  }
  
  db.run(
    `INSERT INTO cart_items (user_id, product_id, quantity, selected_size, selected_color, custom_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, productId, quantity, 
     selectedSize ? JSON.stringify(selectedSize) : null,
     selectedColor ? JSON.stringify(selectedColor) : null,
     customMessage],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ 
        success: true, 
        data: { id: this.lastID.toString() }
      });
    }
  );
});

// Update cart item
router.put('/:itemId', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const { itemId } = req.params;
  const { quantity, selectedSize, selectedColor, customMessage } = req.body;
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(quantity);
  }
  if (selectedSize !== undefined) {
    updates.push('selected_size = ?');
    values.push(selectedSize ? JSON.stringify(selectedSize) : null);
  }
  if (selectedColor !== undefined) {
    updates.push('selected_color = ?');
    values.push(selectedColor ? JSON.stringify(selectedColor) : null);
  }
  if (customMessage !== undefined) {
    updates.push('custom_message = ?');
    values.push(customMessage);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No updates provided' });
  }
  
  values.push(itemId);
  
  db.run(
    `UPDATE cart_items SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true });
    }
  );
});

// Remove item from cart
router.delete('/:itemId', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const { itemId } = req.params;
  
  db.run(
    'DELETE FROM cart_items WHERE id = ?',
    [itemId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true });
    }
  );
});

// Clear user's cart
router.delete('/my', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  
  db.run(
    'DELETE FROM cart_items WHERE user_id = ?',
    [userId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true });
    }
  );
});

// Sync cart (batch update)
router.post('/sync', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'Items array is required' });
  }
  
  // Clear existing cart and insert new items
  db.run('DELETE FROM cart_items WHERE user_id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    const stmt = db.prepare(
      `INSERT INTO cart_items (user_id, product_id, quantity, selected_size, selected_color, custom_message)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    
    items.forEach((item: any) => {
      stmt.run(
        userId,
        item.productId,
        item.quantity,
        item.selectedSize ? JSON.stringify(item.selectedSize) : null,
        item.selectedColor ? JSON.stringify(item.selectedColor) : null,
        item.customMessage
      );
    });
    
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true });
    });
  });
});

export default router;
