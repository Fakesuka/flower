import { Router } from 'express';
import { getDatabase } from '../database/db';
import { verifyTelegramAuth } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Get current user
router.get('/me', verifyTelegramAuth, async (req, res) => {
  try {
    const user = await User.getByTelegramId(req.telegramId!);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        phone: user.phone,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.put('/me', verifyTelegramAuth, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.getByTelegramId(req.telegramId!);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const updates: any = {};
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (phone) updates.phone = phone;
    
    await User.update(user.id, updates);
    
    const updatedUser = await User.getById(user.id);
    res.json({
      success: true,
      data: {
        id: updatedUser!.id,
        firstName: updatedUser!.first_name,
        lastName: updatedUser!.last_name,
        username: updatedUser!.username,
        phone: updatedUser!.phone,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update phone number
router.put('/phone', verifyTelegramAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    const user = await User.getByTelegramId(req.telegramId!);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await User.update(user.id, { phone });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user addresses
router.get('/addresses', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  
  db.all(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true, data: rows });
    }
  );
});

// Add address
router.post('/addresses', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const userId = req.userId;
  const { city, street, house, apartment, entrance, floor, comment } = req.body;
  
  if (!city || !street || !house) {
    return res.status(400).json({ success: false, error: 'City, street and house are required' });
  }
  
  db.run(
    `INSERT INTO addresses (user_id, city, street, house, apartment, entrance, floor, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, city, street, house, apartment, entrance, floor, comment],
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

// Delete address
router.delete('/addresses/:addressId', verifyTelegramAuth, (req, res) => {
  const db = getDatabase();
  const { addressId } = req.params;
  const userId = req.userId;
  
  db.run(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [addressId, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({ success: true });
    }
  );
});

export default router;
