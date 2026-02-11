import { Router } from 'express';
import { StoryModel } from '../models/Story';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Get all stories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const stories = await StoryModel.getAll();
    res.json({ success: true, data: stories });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stories' });
  }
});

// Get story by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const story = await StoryModel.getById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }
    res.json({ success: true, data: story });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ success: false, error: 'Failed to get story' });
  }
});

// Create story (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const story = req.body;
    await StoryModel.create(story);
    res.json({ success: true, message: 'Story created' });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ success: false, error: 'Failed to create story' });
  }
});

// Update story (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    await StoryModel.update(req.params.id, req.body);
    res.json({ success: true, message: 'Story updated' });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ success: false, error: 'Failed to update story' });
  }
});

// Delete story (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await StoryModel.delete(req.params.id);
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete story' });
  }
});

export default router;
