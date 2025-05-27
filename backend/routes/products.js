import express from 'express';
import Joi from 'joi';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Validation schemas
const productSearchSchema = Joi.object({
  query: Joi.string().optional(),
  category: Joi.string().optional(),
  colors: Joi.array().items(Joi.string()).optional(),
  elements: Joi.array().items(Joi.string()).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  page: Joi.number().integer().min(1).default(1),
  sortBy: Joi.string().valid('price', 'rating', 'name', 'created_at').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { error, value } = productSearchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Tham số không hợp lệ',
        details: error.details.map(d => d.message)
      });
    }

    const { 
      query, category, colors, elements, 
      minPrice, maxPrice, limit, page, 
      sortBy, sortOrder 
    } = value;

    const db = getDB();
    const skip = (page - 1) * limit;

    // Build match conditions
    const matchConditions = { stock: { $gt: 0 } };

    if (query) {
      matchConditions.$text = { $search: query };
    }

    if (category) {
      matchConditions.category = category;
    }

    if (colors && colors.length > 0) {
      matchConditions.colors = { $in: colors };
    }

    if (elements && elements.length > 0) {
      matchConditions.feng_shui_elements = { $in: elements };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      matchConditions.price = {};
      if (minPrice !== undefined) matchConditions.price.$gte = minPrice;
      if (maxPrice !== undefined) matchConditions.price.$lte = maxPrice;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute aggregation
    const pipeline = [
      { $match: matchConditions },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          colors: 1,
          feng_shui_elements: 1,
          price: 1,
          images: 1,
          rating: 1,
          stock: 1,
          created_at: 1
        }
      }
    ];

    const [products, totalCount] = await Promise.all([
      db.collection('products').aggregate(pipeline).toArray(),
      db.collection('products').countDocuments(matchConditions)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Products search error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách sản phẩm'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'ID sản phẩm không hợp lệ'
      });
    }

    const db = getDB();
    const product = await db.collection('products').findOne({
      _id: new ObjectId(id)
    });

    if (!product) {
      return res.status(404).json({
        error: 'Không tìm thấy sản phẩm'
      });
    }

    // Update view count
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin sản phẩm'
    });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('products').distinct('category');
    
    res.json({
      success: true,
      data: categories.filter(Boolean).sort()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách danh mục'
    });
  }
});

// Get available colors
router.get('/meta/colors', async (req, res) => {
  try {
    const db = getDB();
    const colors = await db.collection('products').distinct('colors');
    
    res.json({
      success: true,
      data: colors.filter(Boolean).sort()
    });

  } catch (error) {
    console.error('Get colors error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách màu sắc'
    });
  }
});

// Get feng shui elements
router.get('/meta/elements', async (req, res) => {
  try {
    const db = getDB();
    const elements = await db.collection('products').distinct('feng_shui_elements');
    
    res.json({
      success: true,
      data: elements.filter(Boolean).sort()
    });

  } catch (error) {
    console.error('Get elements error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách ngũ hành'
    });
  }
});

// Get price range
router.get('/meta/price-range', async (req, res) => {
  try {
    const db = getDB();
    const priceStats = await db.collection('products').aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]).toArray();

    const stats = priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 };

    res.json({
      success: true,
      data: {
        min: Math.floor(stats.minPrice || 0),
        max: Math.ceil(stats.maxPrice || 0),
        average: Math.round(stats.avgPrice || 0)
      }
    });

  } catch (error) {
    console.error('Get price range error:', error);
    res.status(500).json({
      error: 'Không thể lấy khoảng giá'
    });
  }
});

// Search products by feng shui compatibility
router.post('/feng-shui-search', async (req, res) => {
  try {
    const schema = Joi.object({
      birthYear: Joi.number().integer().min(1900).max(2100).required(),
      category: Joi.string().optional(),
      limit: Joi.number().integer().min(1).max(20).default(10)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: error.details.map(d => d.message)
      });
    }

    const { birthYear, category, limit } = value;
    
    // Calculate element and compatible colors
    const analyzer = new (await import('../services/FengShuiAnalyzer.js')).default();
    const element = analyzer.calculateElement(birthYear);
    const colorInfo = analyzer.getColorInfo(element);

    const db = getDB();
    const matchConditions = {
      stock: { $gt: 0 },
      $or: [
        { colors: { $in: colorInfo.compatible } },
        { colors: { $in: colorInfo.beneficial } },
        { feng_shui_elements: element }
      ]
    };

    if (category) {
      matchConditions.category = category;
    }

    const products = await db.collection('products').find(matchConditions)
      .limit(limit)
      .sort({ rating: -1, price: 1 })
      .toArray();

    res.json({
      success: true,
      data: {
        element,
        compatibleColors: colorInfo.compatible,
        beneficialColors: colorInfo.beneficial,
        products
      }
    });

  } catch (error) {
    console.error('Feng shui search error:', error);
    res.status(500).json({
      error: 'Không thể tìm kiếm sản phẩm phong thủy'
    });
  }
});

export default router;