import { Router } from 'express';
import { ProductModel } from '../models/Product';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Get all products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const products = await ProductModel.getAll();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await ProductModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

// Get products by category
router.get('/category/:categoryId', optionalAuth, async (req, res) => {
  try {
    const products = await ProductModel.getByCategory(req.params.categoryId);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// Get bestsellers
router.get('/bestsellers/all', optionalAuth, async (req, res) => {
  try {
    const products = await ProductModel.getBestsellers();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bestsellers' });
  }
});

// Get new products
router.get('/new/all', optionalAuth, async (req, res) => {
  try {
    const products = await ProductModel.getNew();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get new products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get new products' });
  }
});

// Search products
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json({ success: true, data: [] });
    }
    const products = await ProductModel.search(query);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});

// Create product (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const product = req.body;
    await ProductModel.create(product);
    res.json({ success: true, message: 'Product created' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    await ProductModel.update(req.params.id, req.body);
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await ProductModel.delete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

export default router;
