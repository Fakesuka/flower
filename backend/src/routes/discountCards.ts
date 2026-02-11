import { Router } from 'express';
import { DiscountCardModel } from '../models/DiscountCard';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get user's discount card
router.get('/my', requireAuth, async (req, res) => {
  try {
    const card = await DiscountCardModel.getByUserId(req.user!.id);
    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Get discount card error:', error);
    res.status(500).json({ success: false, error: 'Failed to get discount card' });
  }
});

// Request new discount card
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { cardNumber } = req.body;
    
    // Validate card number is between 1 and 9999
    const cardNum = parseInt(cardNumber);
    if (!cardNumber || isNaN(cardNum) || cardNum < 1 || cardNum > 9999) {
      return res.status(400).json({ 
        success: false, 
        error: 'Номер карты должен быть числом от 1 до 9999' 
      });
    }

    const formattedCardNumber = cardNum.toString();

    // Check if card already exists
    const existingCard = await DiscountCardModel.findByCardNumber(formattedCardNumber);
    if (existingCard) {
      return res.status(400).json({ 
        success: false, 
        error: 'Этот номер карты уже зарегистрирован' 
      });
    }

    // Check if user already has a pending card
    const userCard = await DiscountCardModel.getByUserId(req.user!.id);
    if (userCard && userCard.status === 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'У вас уже есть заявка на карту в обработке' 
      });
    }

    await DiscountCardModel.create({
      id: `card-${Date.now()}`,
      user_id: req.user!.id,
      card_number: formattedCardNumber,
      discount_percent: 0,
      status: 'pending'
    });

    res.json({ success: true, message: 'Заявка на карту отправлена' });
  } catch (error) {
    console.error('Request discount card error:', error);
    res.status(500).json({ success: false, error: 'Failed to request discount card' });
  }
});

// Delete user's discount card
router.delete('/my', requireAuth, async (req, res) => {
  try {
    const card = await DiscountCardModel.getByUserId(req.user!.id);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    await DiscountCardModel.delete(card.id);
    res.json({ success: true, message: 'Card removed' });
  } catch (error) {
    console.error('Delete discount card error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove card' });
  }
});

// Admin: Get all pending cards
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const cards = await DiscountCardModel.getPending();
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Get pending cards error:', error);
    res.status(500).json({ success: false, error: 'Failed to get pending cards' });
  }
});

// Admin: Get all cards
router.get('/', requireAuth, async (req, res) => {
  try {
    const cards = await DiscountCardModel.getAll();
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Get all cards error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cards' });
  }
});

// Admin: Approve card
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { discountPercent } = req.body;
    
    if (!discountPercent || discountPercent < 1 || discountPercent > 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discount percent must be between 1 and 50' 
      });
    }

    await DiscountCardModel.approve(req.params.id, discountPercent);
    res.json({ success: true, message: 'Card approved' });
  } catch (error) {
    console.error('Approve card error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve card' });
  }
});

// Admin: Reject card
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    await DiscountCardModel.reject(req.params.id);
    res.json({ success: true, message: 'Card rejected' });
  } catch (error) {
    console.error('Reject card error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject card' });
  }
});

export default router;
