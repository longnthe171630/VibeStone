const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

class Product {
  constructor(data) {
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.colors = data.colors || [];
    this.feng_shui_elements = data.feng_shui_elements || [];
    this.price = data.price;
    this.originalPrice = data.originalPrice || data.price;
    this.images = data.images || [];
    this.rating = data.rating || 0;
    this.reviewCount = data.reviewCount || 0;
    this.stock = data.stock || 0;
    this.keywords = data.keywords || [];
    this.tags = data.tags || [];
    this.specifications = data.specifications || {};
    this.dimensions = data.dimensions || {};
    this.material = data.material;
    this.origin = data.origin;
    this.brand = data.brand;
    this.isActive = data.isActive !== false;
    this.isFeatured = data.isFeatured || false;
    this.views = data.views || 0;
    this.soldCount = data.soldCount || 0;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Validate product data
  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Tên sản phẩm phải có ít nhất 2 ký tự');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Mô tả sản phẩm phải có ít nhất 10 ký tự');
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push('Danh mục sản phẩm là bắt buộc');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Giá sản phẩm phải lớn hơn 0');
    }

    if (!Array.isArray(data.colors) || data.colors.length === 0) {
      errors.push('Sản phẩm phải có ít nhất một màu sắc');
    }

    if (!Array.isArray(data.feng_shui_elements) || data.feng_shui_elements.length === 0) {
      errors.push('Sản phẩm phải thuộc ít nhất một ngũ hành');
    }

    const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
    if (data.feng_shui_elements && !data.feng_shui_elements.every(el => validElements.includes(el))) {
      errors.push('Ngũ hành không hợp lệ');
    }

    if (data.stock && data.stock < 0) {
      errors.push('Số lượng tồn kho không được âm');
    }

    return errors;
  }

  // Create new product
  static async create(productData) {
    try {
      const errors = this.validate(productData);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const db = getDB();
      const product = new Product(productData);
      
      // Tự động tạo keywords từ tên và mô tả
      product.keywords = this.generateKeywords(product.name, product.description);
      
      const result = await db.collection('products').insertOne(product);
      
      return { 
        _id: result.insertedId, 
        ...product 
      };
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  // Find product by ID
  static async findById(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid product ID');
      }

      const db = getDB();
      const product = await db.collection('products').findOne({
        _id: new ObjectId(id)
      });

      return product;
    } catch (error) {
      console.error('Find product error:', error);
      throw error;
    }
  }

  // Update product
  static async updateById(id, updateData) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid product ID');
      }

      const errors = this.validate({ ...updateData, _skipRequired: true });
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const db = getDB();
      updateData.updated_at = new Date();

      // Cập nhật keywords nếu tên hoặc mô tả thay đổi
      if (updateData.name || updateData.description) {
        const currentProduct = await this.findById(id);
        if (currentProduct) {
          const name = updateData.name || currentProduct.name;
          const description = updateData.description || currentProduct.description;
          updateData.keywords = this.generateKeywords(name, description);
        }
      }

      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Product not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  // Delete product (soft delete)
  static async deleteById(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid product ID');
      }

      const db = getDB();
      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            isActive: false, 
            deleted_at: new Date(),
            updated_at: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Product not found');
      }

      return { success: true, deletedId: id };
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  // Search products with advanced filters
  static async search(filters = {}) {
    try {
      const db = getDB();
      const {
        query,
        category,
        colors,
        elements,
        minPrice,
        maxPrice,
        inStock,
        isActive = true,
        limit = 20,
        page = 1,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const matchConditions = { isActive };

      if (inStock) {
        matchConditions.stock = { $gt: 0 };
      }

      if (query) {
        matchConditions.$text = { $search: query };
      }

      if (category) {
        matchConditions.category = new RegExp(category, 'i');
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

      const skip = (page - 1) * limit;
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [products, totalCount] = await Promise.all([
        db.collection('products')
          .find(matchConditions)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('products').countDocuments(matchConditions)
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // Find products by feng shui compatibility
  static async findByFengShuiCompatibility(birthYear, options = {}) {
    try {
      const FengShuiAnalyzer = require('../services/FengShuiAnalyzer');
      const analyzer = new FengShuiAnalyzer();
      
      const element = analyzer.calculateElement(birthYear);
      const colorInfo = analyzer.getColorInfo(element);
      
      const db = getDB();
      const {
        category,
        limit = 20,
        prioritizeBeneficial = true
      } = options;

      let matchConditions = {
        isActive: true,
        stock: { $gt: 0 }
      };

      if (category) {
        matchConditions.category = category;
      }

      // Tạo aggregation pipeline với scoring
      const pipeline = [
        { $match: matchConditions },
        {
          $addFields: {
            compatibilityScore: {
              $add: [
                // Điểm cao nhất cho màu mang lại may mắn
                {
                  $cond: [
                    { $gt: [{ $size: { $setIntersection: ['$colors', colorInfo.beneficial] } }, 0] },
                    prioritizeBeneficial ? 30 : 20, 0
                  ]
                },
                // Điểm cho màu tương hợp
                {
                  $cond: [
                    { $gt: [{ $size: { $setIntersection: ['$colors', colorInfo.compatible] } }, 0] },
                    15, 0
                  ]
                },
                // Điểm cho ngũ hành phù hợp
                {
                  $cond: [
                    { $in: [element, '$feng_shui_elements'] },
                    10, 0
                  ]
                },
                // Điểm rating và popularity
                { $ifNull: ['$rating', 0] },
                { $divide: [{ $ifNull: ['$soldCount', 0] }, 100] }
              ]
            }
          }
        },
        { $match: { compatibilityScore: { $gt: 0 } } },
        { $sort: { compatibilityScore: -1, rating: -1, price: 1 } },
        { $limit: limit }
      ];

      const products = await db.collection('products').aggregate(pipeline).toArray();

      return {
        element,
        compatibleColors: colorInfo.compatible,
        beneficialColors: colorInfo.beneficial,
        avoidColors: colorInfo.avoid,
        products
      };
    } catch (error) {
      console.error('Feng shui compatibility search error:', error);
      throw error;
    }
  }

  // Get trending products
  static async getTrending(limit = 10) {
    try {
      const db = getDB();
      
      const products = await db.collection('products')
        .find({ 
          isActive: true, 
          stock: { $gt: 0 } 
        })
        .sort({ 
          views: -1, 
          soldCount: -1, 
          rating: -1,
          created_at: -1 
        })
        .limit(limit)
        .toArray();

      return products;
    } catch (error) {
      console.error('Get trending products error:', error);
      throw error;
    }
  }

  // Update product stats (views, rating, etc.)
  static async updateStats(id, stats) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid product ID');
      }

      const db = getDB();
      const updateFields = {};

      if (stats.views) {
        updateFields.$inc = { views: 1 };
      }

      if (stats.rating && stats.reviewCount) {
        updateFields.$set = {
          rating: stats.rating,
          reviewCount: stats.reviewCount,
          updated_at: new Date()
        };
      }

      if (stats.soldCount) {
        updateFields.$inc = { 
          ...(updateFields.$inc || {}),
          soldCount: stats.soldCount,
          stock: -stats.soldCount
        };
      }

      if (Object.keys(updateFields).length === 0) {
        return null;
      }

      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        updateFields
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Update product stats error:', error);
      throw error;
    }
  }

  // Generate keywords from product name and description
  static generateKeywords(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    const words = text.match(/[\w\u00C0-\u1EF9]+/g) || [];
    
    // Loại bỏ stop words và từ ngắn
    const stopWords = ['và', 'của', 'cho', 'với', 'từ', 'trong', 'trên', 'dưới', 'là', 'có', 'được'];
    const keywords = words
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates

    return keywords;
  }

  // Get product categories
  static async getCategories() {
    try {
      const db = getDB();
      const categories = await db.collection('products')
        .distinct('category', { isActive: true });
        
      return categories.filter(Boolean).sort();
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  // Get available colors
  static async getColors() {
    try {
      const db = getDB();
      const colors = await db.collection('products')
        .distinct('colors', { isActive: true });
        
      return colors.filter(Boolean).sort();
    } catch (error) {
      console.error('Get colors error:', error);
      throw error;
    }
  }

  // Get price statistics
  static async getPriceStats() {
    try {
      const db = getDB();
      const stats = await db.collection('products').aggregate([
        { $match: { isActive: true, stock: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      return stats[0] || { 
        minPrice: 0, 
        maxPrice: 0, 
        avgPrice: 0, 
        count: 0 
      };
    } catch (error) {
      console.error('Get price stats error:', error);
      throw error;
    }
  }
}

module.exports = Product;