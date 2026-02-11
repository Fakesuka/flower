import { Router } from 'express';
import { SettingsModel } from '../models/Settings';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Get all settings (public)
router.get('/', async (req, res) => {
  try {
    const settings = await SettingsModel.getAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// Get specific setting (public)
router.get('/:key', async (req, res) => {
  try {
    const value = await SettingsModel.get(req.params.key);
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to get setting' });
  }
});

// Update settings (admin only)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    await SettingsModel.updateMultiple(settings);
    const updated = await SettingsModel.getAll();
    res.json({ success: true, data: updated, message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// Update single setting (admin only)
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'Value is required' });
    }
    await SettingsModel.set(req.params.key, String(value));
    res.json({ success: true, message: 'Setting updated' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

export default router;
