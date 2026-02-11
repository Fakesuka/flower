import { Router } from 'express';
import { OrderModel } from '../models/Order';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get user's orders
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await OrderModel.getByUserId(req.user!.id);
    
    // Parse JSON fields
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      address: JSON.parse(order.address),
      recipient: JSON.parse(order.recipient)
    }));
    
    res.json({ success: true, data: parsedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

// Get order by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await OrderModel.getById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...order,
        items: JSON.parse(order.items),
        address: JSON.parse(order.address),
        recipient: JSON.parse(order.recipient)
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

// Create new order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      items, 
      total, 
      subtotal, 
      deliveryCost, 
      discountAmount, 
      discountCardId,
      deliveryDate,
      deliveryTime,
      address,
      recipient,
      paymentMethod,
      storeLocation,
      paymentUrl
    } = req.body;

    if (!items || !total || !address || !recipient || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Validate store location
    const validLocations = ['cvetochaya_lavka', 'florenciya'];
    const location = validLocations.includes(storeLocation) ? storeLocation : 'cvetochaya_lavka';

    const orderId = `order-${Date.now()}`;
    
    await OrderModel.create({
      id: orderId,
      user_id: req.user!.id,
      status: 'pending',
      total,
      subtotal: subtotal || total,
      delivery_cost: deliveryCost || 0,
      discount_amount: discountAmount || 0,
      discount_card_id: discountCardId || null,
      delivery_date: deliveryDate || null,
      delivery_time: deliveryTime || null,
      address: JSON.stringify(address),
      recipient: JSON.stringify(recipient),
      payment_method: paymentMethod,
      items: JSON.stringify(items),
      store_location: location as any,
      payment_status: 'pending',
      payment_url: paymentUrl || null
    });

    // Notify florists about new order
    const { notifyFloristsAboutOrder } = await import('../bots/floristBot');
    await notifyFloristsAboutOrder(orderId);

    res.json({ success: true, data: { orderId } });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Cancel order
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await OrderModel.getById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    await OrderModel.updateStatus(req.params.id, 'cancelled');
    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

// Admin: Get all orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await OrderModel.getAll();
    
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      address: JSON.parse(order.address),
      recipient: JSON.parse(order.recipient)
    }));
    
    res.json({ success: true, data: parsedOrders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

// Admin: Update order status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'preparing', 'delivering', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status' 
      });
    }

    await OrderModel.updateStatus(req.params.id, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

export default router;
