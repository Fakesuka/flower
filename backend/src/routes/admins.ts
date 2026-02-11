import { Router } from 'express';
import { AdminModel } from '../models/Admin';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Get all admins (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const admins = await AdminModel.getAll();
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, error: 'Failed to get admins' });
  }
});

// Check if current user is admin
router.get('/check', async (req, res) => {
  try {
    const telegramId = req.user?.telegramId;
    if (!telegramId) {
      return res.json({ success: true, data: { isAdmin: false } });
    }
    const isAdmin = await AdminModel.isAdmin(telegramId);
    const admin = isAdmin ? await AdminModel.findByTelegramId(telegramId) : null;
    res.json({ 
      success: true, 
      data: { 
        isAdmin, 
        role: admin?.role || null 
      } 
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ success: false, error: 'Failed to check admin status' });
  }
});

// Add new admin (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { telegramId, name, role = 'florist' } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'telegramId is required' });
    }

    // Check if already admin
    const existing = await AdminModel.findByTelegramId(telegramId);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User is already an admin' });
    }

    await AdminModel.create(telegramId, name, role);
    res.json({ success: true, message: 'Admin added successfully' });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ success: false, error: 'Failed to add admin' });
  }
});

// Update admin role (admin only)
router.put('/:telegramId/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'florist'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Valid role is required (admin or florist)' });
    }

    await AdminModel.updateRole(req.params.telegramId, role);
    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// Remove admin (admin only)
router.delete('/:telegramId', requireAdmin, async (req, res) => {
  try {
    await AdminModel.delete(req.params.telegramId);
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove admin' });
  }
});

export default router;
