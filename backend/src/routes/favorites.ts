import { Router } from 'express';
import { FavoriteModel } from '../models/Favorite';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get user's favorites
router.get('/', requireAuth, async (req, res) => {
  try {
    const favorites = await FavoriteModel.getByUserId(req.user!.id);
    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
});

// Add to favorites
router.post('/:productId', requireAuth, async (req, res) => {
  try {
    await FavoriteModel.add(req.user!.id, req.params.productId);
    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

// Remove from favorites
router.delete('/:productId', requireAuth, async (req, res) => {
  try {
    await FavoriteModel.remove(req.user!.id, req.params.productId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

// Check if product is favorite
router.get('/:productId/check', requireAuth, async (req, res) => {
  try {
    const isFavorite = await FavoriteModel.isFavorite(req.user!.id, req.params.productId);
    res.json({ success: true, data: { isFavorite } });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to check favorite' });
  }
});

export default router;
