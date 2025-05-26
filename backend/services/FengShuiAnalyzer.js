export class FengShuiAnalyzer {
  constructor() {
    this.elementNames = {
      1: 'Kim',
      2: 'Thủy',
      3: 'Hỏa',
      4: 'Thổ',
      5: 'Mộc'
    };

    this.colorMapping = {
      'Kim': { compatible: ['trắng', 'bạc', 'vàng', 'nâu', 'xám'], beneficial: ['vàng', 'nâu'], avoid: ['đỏ', 'cam', 'hồng', 'tím'] },
      'Mộc': { compatible: ['xanh lá', 'xanh lam', 'đen', 'xanh đậm'], beneficial: ['đen', 'xanh đậm'], avoid: ['trắng', 'bạc', 'xám'] },
      'Thủy': { compatible: ['đen', 'xanh đậm', 'bạc', 'trắng'], beneficial: ['trắng', 'bạc', 'xám'], avoid: ['vàng', 'nâu', 'be'] },
      'Hỏa': { compatible: ['đỏ', 'cam', 'hồng', 'tím', 'xanh lá'], beneficial: ['xanh lá', 'xanh lam'], avoid: ['đen', 'xanh đậm'] },
      'Thổ': { compatible: ['vàng', 'nâu', 'cam', 'be', 'đỏ'], beneficial: ['đỏ', 'cam', 'hồng'], avoid: ['xanh lá', 'xanh lam'] }
    };

    this.directionMapping = {
      'Kim': ['Tây', 'Tây Bắc'],
      'Mộc': ['Đông', 'Đông Nam'],
      'Thủy': ['Bắc'],
      'Hỏa': ['Nam'],
      'Thổ': ['Tây Nam', 'Đông Bắc']
    };

    this.luckyNumbers = {
      'Kim': [6, 7],
      'Mộc': [3, 4],
      'Thủy': [1, 6],
      'Hỏa': [2, 7],
      'Thổ': [5, 8]
    };
  }

  calculateElement(birthYear) {
    const offset = birthYear - 1984;
    const canIndex = (offset % 10 + 10) % 10;
    const chiIndex = (offset % 12 + 12) % 12;

    const canValue = Math.floor(canIndex / 2) + 1;
    const chiValue = [0, 1, 6, 7].includes(chiIndex) ? 0 : [2, 3, 8, 9].includes(chiIndex) ? 1 : 2;

    let elementValue = canValue + chiValue;
    if (elementValue > 5) elementValue -= 5;

    return this.elementNames[elementValue];
  }

  analyzeByBirthYear(birthYear, gender, preferences) {
    const element = this.calculateElement(birthYear);
    const colorInfo = this.colorMapping[element];
    const luckyDirections = this.directionMapping[element];
    const luckyNumbers = this.luckyNumbers[element];

    return {
      birthYear,
      element,
      compatibleColors: colorInfo.compatible,
      beneficialColors: colorInfo.beneficial,
      avoidColors: colorInfo.avoid,
      luckyDirections,
      luckyNumbers,
      analysis: this.generateAnalysisText(element, birthYear, gender, preferences)
    };
  }

  generateAnalysisText(element, birthYear, gender, preferences) {
    const desc = {
      'Kim': 'cá tính mạnh mẽ, kiên định, thực tế và khả năng tổ chức tốt.',
      'Thủy': 'thông minh, linh hoạt, có trí tưởng tượng và giao tiếp tốt.',
      'Mộc': 'nhân hậu, sáng tạo, hòa đồng và biết quan tâm.',
      'Hỏa': 'nhiệt tình, năng động và truyền cảm hứng.',
      'Thổ': 'ổn định, chân thành và đáng tin cậy.'
    };

    let text = `Bạn sinh năm ${birthYear} thuộc mệnh ${element}.\n\n`;
    text += `Bạn là người ${desc[element]}\n\n`;

    if (gender) {
      text += gender === 'male'
        ? `Là nam mệnh ${element}, bạn nên phát huy khả năng lãnh đạo và sự quyết đoán.\n\n`
        : `Là nữ mệnh ${element}, bạn nên phát triển sự tinh tế và khả năng lắng nghe.\n\n`;
    }

    if (preferences?.trim()) {
      text += `🎯 Gợi ý theo sở thích:\n- Dùng màu hợp và màu tương sinh để tăng tài lộc.\n- Bố trí nhà cửa/hướng bàn làm việc theo hướng tốt.\n- Tận dụng con số may mắn khi chọn ngày, số điện thoại, biển số, v.v.\n\n`;
    }

    return text;
  }
}
