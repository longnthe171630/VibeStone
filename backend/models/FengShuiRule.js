const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

class FengShuiRule {
  constructor(data) {
    this.element = data.element;
    this.birth_years = data.birth_years || [];
    this.compatible_colors = data.compatible_colors || [];
    this.beneficial_colors = data.beneficial_colors || [];
    this.avoid_colors = data.avoid_colors || [];
    this.lucky_directions = data.lucky_directions || [];
    this.lucky_numbers = data.lucky_numbers || [];
    this.compatible_elements = data.compatible_elements || [];
    this.conflicting_elements = data.conflicting_elements || [];
    this.supporting_elements = data.supporting_elements || [];
    this.supported_by_elements = data.supported_by_elements || [];
    this.characteristics = data.characteristics || {};
    this.career_advice = data.career_advice || [];
    this.health_advice = data.health_advice || [];
    this.relationship_advice = data.relationship_advice || [];
    this.wealth_advice = data.wealth_advice || [];
    this.suitable_materials = data.suitable_materials || [];
    this.suitable_shapes = data.suitable_shapes || [];
    this.suitable_locations = data.suitable_locations || [];
    this.recommended_stones = data.recommended_stones || [];
    this.recommended_plants = data.recommended_plants || [];
    this.isActive = data.isActive !== false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Validate feng shui rule data
  static validate(data) {
    const errors = [];
    const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

    if (!data.element || !validElements.includes(data.element)) {
      errors.push('Ngũ hành phải là một trong: Kim, Mộc, Thủy, Hỏa, Thổ');
    }

    if (!Array.isArray(data.birth_years) || data.birth_years.length === 0) {
      errors.push('Phải có ít nhất một năm sinh');
    }

    if (data.birth_years && data.birth_years.some(year => year < 1900 || year > 2100)) {
      errors.push('Năm sinh phải trong khoảng 1900-2100');
    }

    if (!Array.isArray(data.compatible_colors) || data.compatible_colors.length === 0) {
      errors.push('Phải có ít nhất một màu tương hợp');
    }

    if (!Array.isArray(data.lucky_directions) || data.lucky_directions.length === 0) {
      errors.push('Phải có ít nhất một hướng may mắn');
    }

    return errors;
  }

  // Create new feng shui rule
  static async create(ruleData) {
    try {
      const errors = this.validate(ruleData);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const db = getDB();
      
      // Check if rule for this element already exists
      const existingRule = await db.collection('feng_shui_rules').findOne({
        element: ruleData.element
      });

      if (existingRule) {
        throw new Error(`Quy tắc cho mệnh ${ruleData.element} đã tồn tại`);
      }

      const rule = new FengShuiRule(ruleData);
      const result = await db.collection('feng_shui_rules').insertOne(rule);
      
      return { 
        _id: result.insertedId, 
        ...rule 
      };
    } catch (error) {
      console.error('Create feng shui rule error:', error);
      throw error;
    }
  }

  // Find rule by element
  static async findByElement(element) {
    try {
      const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
      if (!validElements.includes(element)) {
        throw new Error('Ngũ hành không hợp lệ');
      }

      const db = getDB();
      const rule = await db.collection('feng_shui_rules').findOne({
        element: element,
        isActive: true
      });

      return rule;
    } catch (error) {
      console.error('Find feng shui rule error:', error);
      throw error;
    }
  }

  // Find rule by birth year
  static async findByBirthYear(birthYear) {
    try {
      if (!birthYear || birthYear < 1900 || birthYear > 2100) {
        throw new Error('Năm sinh không hợp lệ');
      }

      const db = getDB();
      const rule = await db.collection('feng_shui_rules').findOne({
        birth_years: birthYear,
        isActive: true
      });

      return rule;
    } catch (error) {
      console.error('Find feng shui rule by birth year error:', error);
      throw error;
    }
  }

  // Get all active feng shui rules
  static async findAll() {
    try {
      const db = getDB();
      const rules = await db.collection('feng_shui_rules')
        .find({ isActive: true })
        .sort({ element: 1 })
        .toArray();

      return rules;
    } catch (error) {
      console.error('Find all feng shui rules error:', error);
      throw error;
    }
  }

  // Update feng shui rule
  static async updateByElement(element, updateData) {
    try {
      const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
      if (!validElements.includes(element)) {
        throw new Error('Ngũ hành không hợp lệ');
      }

      const db = getDB();
      updateData.updated_at = new Date();

      const result = await db.collection('feng_shui_rules').updateOne(
        { element: element },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Không tìm thấy quy tắc phong thủy');
      }

      return await this.findByElement(element);
    } catch (error) {
      console.error('Update feng shui rule error:', error);
      throw error;
    }
  }

  // Delete feng shui rule (soft delete)
  static async deleteByElement(element) {
    try {
      const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
      if (!validElements.includes(element)) {
        throw new Error('Ngũ hành không hợp lệ');
      }

      const db = getDB();
      const result = await db.collection('feng_shui_rules').updateOne(
        { element: element },
        { 
          $set: { 
            isActive: false, 
            deleted_at: new Date(),
            updated_at: new Date()
          } 
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Không tìm thấy quy tắc phong thủy');
      }

      return { success: true, deletedElement: element };
    } catch (error) {
      console.error('Delete feng shui rule error:', error);
      throw error;
    }
  }

  // Get compatibility between two elements
  static async getCompatibility(element1, element2) {
    try {
      const validElements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
      if (!validElements.includes(element1) || !validElements.includes(element2)) {
        throw new Error('Ngũ hành không hợp lệ');
      }

      const db = getDB();
      const rule1 = await db.collection('feng_shui_rules').findOne({
        element: element1,
        isActive: true
      });

      if (!rule1) {
        throw new Error(`Không tìm thấy quy tắc cho mệnh ${element1}`);
      }

      let compatibilityType = 'neutral';
      let description = '';

      if (rule1.compatible_elements.includes(element2)) {
        compatibilityType = 'compatible';
        description = `${element1} và ${element2} tương hợp tốt`;
      } else if (rule1.supporting_elements.includes(element2)) {
        compatibilityType = 'supporting';
        description = `${element1} hỗ trợ ${element2}`;
      } else if (rule1.supported_by_elements.includes(element2)) {
        compatibilityType = 'supported';
        description = `${element1} được ${element2} hỗ trợ`;
      } else if (rule1.conflicting_elements.includes(element2)) {
        compatibilityType = 'conflicting';
        description = `${element1} và ${element2} xung khắc`;
      } else {
        description = `${element1} và ${element2} tương tác trung tính`;
      }

      return {
        element1,
        element2,
        compatibilityType,
        description,
        score: this.getCompatibilityScore(compatibilityType)
      };
    } catch (error) {
      console.error('Get compatibility error:', error);
      throw error;
    }
  }

  // Get compatibility score
  static getCompatibilityScore(compatibilityType) {
    const scores = {
      'supported': 10,
      'supporting': 8,
      'compatible': 6,
      'neutral': 0,
      'conflicting': -5
    };

    return scores[compatibilityType] || 0;
  }

  // Get detailed analysis for a person
  static async getDetailedAnalysis(birthYear, preferences = {}) {
    try {
      const rule = await this.findByBirthYear(birthYear);
      if (!rule) {
        // Fallback to calculation if no rule found
        const FengShuiAnalyzer = require('../services/FengShuiAnalyzer');
        const analyzer = new FengShuiAnalyzer();
        const element = analyzer.calculateElement(birthYear);
        const fallbackRule = await this.findByElement(element);
        if (!fallbackRule) {
          throw new Error('Không tìm thấy quy tắc phong thủy phù hợp');
        }
        return this.formatAnalysis(fallbackRule, birthYear, preferences);
      }

      return this.formatAnalysis(rule, birthYear, preferences);
    } catch (error) {
      console.error('Get detailed analysis error:', error);
      throw error;
    }
  }

  // Format analysis for display
  static formatAnalysis(rule, birthYear, preferences) {
    const analysis = {
      element: rule.element,
      birthYear: birthYear,
      colors: {
        compatible: rule.compatible_colors,
        beneficial: rule.beneficial_colors,
        avoid: rule.avoid_colors
      },
      directions: rule.lucky_directions,
      numbers: rule.lucky_numbers,
      materials: rule.suitable_materials,
      shapes: rule.suitable_shapes,
      stones: rule.recommended_stones,
      plants: rule.recommended_plants,
      advice: {
        career: rule.career_advice,
        health: rule.health_advice,
        relationship: rule.relationship_advice,
        wealth: rule.wealth_advice
      },
      characteristics: rule.characteristics
    };

    // Add personalized recommendations based on preferences
    if (preferences.focus) {
      analysis.personalizedAdvice = this.getPersonalizedAdvice(rule, preferences.focus);
    }

    return analysis;
  }

  // Get personalized advice based on focus area
  static getPersonalizedAdvice(rule, focusArea) {
    const adviceMap = {
      'career': rule.career_advice,
      'health': rule.health_advice,
      'relationship': rule.relationship_advice,
      'wealth': rule.wealth_advice
    };

    return adviceMap[focusArea] || rule.career_advice;
  }

  // Initialize default feng shui rules
  static async initializeDefaultRules() {
    try {
      const db = getDB();
      const existingRules = await db.collection('feng_shui_rules').countDocuments();
      
      if (existingRules > 0) {
        console.log('Feng shui rules already exist, skipping initialization');
        return;
      }

      const defaultRules = [
        {
          element: 'Kim',
          birth_years: [1980, 1981, 1990, 1991, 2000, 2001, 2010, 2011],
          compatible_colors: ['trắng', 'bạc', 'vàng', 'nâu', 'xám'],
          beneficial_colors: ['vàng', 'nâu'],
          avoid_colors: ['đỏ', 'cam', 'hồng', 'tím'],
          lucky_directions: ['Tây', 'Tây Bắc'],
          lucky_numbers: [6, 7],
          compatible_elements: ['Thủy'],
          supporting_elements: ['Thủy'],
          supported_by_elements: ['Thổ'],
          conflicting_elements: ['Hỏa'],
          suitable_materials: ['kim loại', 'đá quý', 'pha lê'],
          suitable_shapes: ['tròn', 'bầu dục'],
          recommended_stones: ['thạch anh trắng', 'ngọc trai', 'kim cương']
        },
        {
          element: 'Mộc',
          birth_years: [1984, 1985, 1994, 1995, 2004, 2005, 2014, 2015],
          compatible_colors: ['xanh lá', 'xanh lam', 'đen', 'xanh đậm'],
          beneficial_colors: ['đen', 'xanh đậm'],
          avoid_colors: ['trắng', 'bạc', 'xám'],
          lucky_directions: ['Đông', 'Đông Nam'],
          lucky_numbers: [3, 4],
          compatible_elements: ['Hỏa'],
          supporting_elements: ['Hỏa'],
          supported_by_elements: ['Thủy'],
          conflicting_elements: ['Kim'],
          suitable_materials: ['gỗ', 'tre', 'cây cối'],
          suitable_shapes: ['chữ nhật', 'hình trụ'],
          recommended_stones: ['ngọc lục bảo', 'malachite', 'aventurine'],
          recommended_plants: ['cây xanh', 'tre', 'cây phong thủy'],
          characteristics: {
            personality: ['sáng tạo', 'linh hoạt', 'kiên nhẫn'],
            strengths: ['khả năng phát triển', 'tính bền bỉ', 'sức sống mạnh'],
            weaknesses: ['dễ bị ảnh hưởng', 'thiếu quyết đoán']
          },
          career_advice: [
            'Phù hợp với nghề giáo dục, y tế',
            'Thích hợp làm việc trong môi trường xanh',
            'Nên phát triển kỹ năng sáng tạo'
          ],
          health_advice: [
            'Chú ý sức khỏe gan mật',
            'Tập thể dục ngoài trời',
            'Ăn nhiều rau xanh'
          ],
          relationship_advice: [
            'Hòa hợp với người mệnh Hỏa',
            'Tránh xung đột với người mệnh Kim',
            'Cần kiên nhẫn trong tình cảm'
          ],
          wealth_advice: [
            'Đầu tư vào bất động sản',
            'Kinh doanh lĩnh vực xanh',
            'Tích lũy từ từ, bền vững'
          ]
        },
        {
          element: 'Thủy',
          birth_years: [1982, 1983, 1992, 1993, 2002, 2003, 2012, 2013],
          compatible_colors: ['đen', 'xanh đậm', 'xanh dương', 'trắng', 'bạc'],
          beneficial_colors: ['trắng', 'bạc', 'xám'],
          avoid_colors: ['vàng', 'nâu', 'cam'],
          lucky_directions: ['Bắc', 'Đông Bắc'],
          lucky_numbers: [1, 6],
          compatible_elements: ['Mộc'],
          supporting_elements: ['Mộc'],
          supported_by_elements: ['Kim'],
          conflicting_elements: ['Thổ'],
          suitable_materials: ['thủy tinh', 'pha lê', 'kim loại'],
          suitable_shapes: ['sóng', 'cong', 'bất quy tắc'],
          recommended_stones: ['sapphire xanh', 'aquamarine', 'lapis lazuli'],
          recommended_plants: ['sen', 'súng', 'cây thủy sinh'],
          characteristics: {
            personality: ['thông minh', 'linh hoạt', 'thích nghi'],
            strengths: ['trí tuệ cao', 'khả năng giao tiếp', 'tính linh động'],
            weaknesses: ['thiếu kiên định', 'dễ thay đổi']
          },
          career_advice: [
            'Phù hợp nghề truyền thông, marketing',
            'Thích hợp làm việc liên quan đến nước',
            'Nên phát triển kỹ năng giao tiếp'
          ],
          health_advice: [
            'Chú ý sức khỏe thận, bàng quang',
            'Uống đủ nước mỗi ngày',
            'Tránh căng thẳng'
          ],
          relationship_advice: [
            'Hòa hợp với người mệnh Mộc',
            'Tránh xung đột với người mệnh Thổ',
            'Cần chân thành trong tình cảm'
          ],
          wealth_advice: [
            'Đầu tư linh hoạt, đa dạng',
            'Kinh doanh lĩnh vực dịch vụ',
            'Tận dụng cơ hội nhanh chóng'
          ]
        },
        {
          element: 'Hỏa',
          birth_years: [1986, 1987, 1996, 1997, 2006, 2007, 2016, 2017],
          compatible_colors: ['đỏ', 'cam', 'hồng', 'tím', 'xanh lá'],
          beneficial_colors: ['xanh lá', 'xanh lam'],
          avoid_colors: ['đen', 'xanh đậm', 'xanh dương'],
          lucky_directions: ['Nam', 'Đông Nam'],
          lucky_numbers: [2, 7],
          compatible_elements: ['Thổ'],
          supporting_elements: ['Thổ'],
          supported_by_elements: ['Mộc'],
          conflicting_elements: ['Thủy'],
          suitable_materials: ['gỗ', 'vải', 'da'],
          suitable_shapes: ['tam giác', 'nhọn', 'hình nón'],
          recommended_stones: ['ruby', 'garnet', 'carnelian'],
          recommended_plants: ['hoa hồng', 'hướng dương', 'cây có hoa đỏ'],
          characteristics: {
            personality: ['nhiệt tình', 'năng động', 'lạc quan'],
            strengths: ['khả năng lãnh đạo', 'tính quyết đoán', 'sức sống mạnh'],
            weaknesses: ['nóng tính', 'thiếu kiên nhẫn']
          },
          career_advice: [
            'Phù hợp nghề lãnh đạo, quản lý',
            'Thích hợp làm việc trong môi trường năng động',
            'Nên phát triển kỹ năng lãnh đạo'
          ],
          health_advice: [
            'Chú ý sức khỏe tim mạch',
            'Tập thể dục đều đặn',
            'Kiểm soát cảm xúc'
          ],
          relationship_advice: [
            'Hòa hợp với người mệnh Thổ',
            'Tránh xung đột với người mệnh Thủy',
            'Cần kiềm chế trong tình cảm'
          ],
          wealth_advice: [
            'Đầu tư táo bạo nhưng cẩn trọng',
            'Kinh doanh lĩnh vực năng lượng',
            'Tận dụng mạng lưới quan hệ'
          ]
        },
        {
          element: 'Thổ',
          birth_years: [1988, 1989, 1998, 1999, 2008, 2009, 2018, 2019],
          compatible_colors: ['vàng', 'nâu', 'cam', 'đỏ', 'hồng'],
          beneficial_colors: ['đỏ', 'cam', 'hồng'],
          avoid_colors: ['xanh lá', 'xanh lam'],
          lucky_directions: ['Tây Nam', 'Đông Bắc'],
          lucky_numbers: [5, 8],
          compatible_elements: ['Kim'],
          supporting_elements: ['Kim'],
          supported_by_elements: ['Hỏa'],
          conflicting_elements: ['Mộc'],
          suitable_materials: ['đất sét', 'gốm sứ', 'đá'],
          suitable_shapes: ['vuông', 'chữ nhật', 'khối'],
          recommended_stones: ['citrine', 'tiger eye', 'amber'],
          recommended_plants: ['cây mọng nước', 'sen đá', 'cây cảnh'],
          characteristics: {
            personality: ['ổn định', 'đáng tin cậy', 'thực tế'],
            strengths: ['tính kiên định', 'khả năng tổ chức', 'sự bền bỉ'],
            weaknesses: ['bảo thủ', 'chậm thích nghi']
          },
          career_advice: [
            'Phù hợp nghề xây dựng, bất động sản',
            'Thích hợp làm việc ổn định lâu dài',
            'Nên phát triển kỹ năng quản lý'
          ],
          health_advice: [
            'Chú ý sức khỏe dạ dày, lách',
            'Ăn uống điều độ',
            'Tập thể dục nhẹ nhàng'
          ],
          relationship_advice: [
            'Hòa hợp với người mệnh Kim',
            'Tránh xung đột với người mệnh Mộc',
            'Cần bao dung trong tình cảm'
          ],
          wealth_advice: [
            'Đầu tư an toàn, dài hạn',
            'Kinh doanh bất động sản',
            'Tích lũy từ từ, ổn định'
          ]
        }
      ];

      for (const ruleData of defaultRules) {
        await db.collection('feng_shui_rules').insertOne(new FengShuiRule(ruleData));
      }

      console.log('Default feng shui rules initialized successfully');
      return { success: true, rulesCount: defaultRules.length };
    } catch (error) {
      console.error('Initialize default rules error:', error);
      throw error;
    }
  }
}

module.exports = FengShuiRule;