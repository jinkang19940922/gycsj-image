const dailyQuoteService = require('../services/dailyQuoteService');

class DailyQuoteController {
  async getDailyQuote(req, res) {
    try {
      const quote = dailyQuoteService.getDailyQuote();
      res.json({ success: true, quote });
    } catch (error) {
      console.error('获取每日一言失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRandomQuote(req, res) {
    try {
      const quote = dailyQuoteService.getRandomQuote();
      res.json({ success: true, quote });
    } catch (error) {
      console.error('获取随机名言失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new DailyQuoteController();