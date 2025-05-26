import express from 'express';
import { FengShuiAnalyzer } from '../services/FengShuiAnalyzer.js';

const router = express.Router();
const analyzer = new FengShuiAnalyzer();

router.post('/analyze-user', async (req, res) => {
  try {
    const { birthYear, gender, preferences } = req.body;
    
    if (!birthYear) {
      return res.status(400).json({ success: false, error: 'Năm sinh là bắt buộc' });
    }
    
    const analysis = analyzer.analyzeByBirthYear(birthYear, gender, preferences);
    
    return res.json({ 
      success: true, 
      data: analysis 
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Lỗi khi phân tích dữ liệu' 
    });
  }
});

export default router;