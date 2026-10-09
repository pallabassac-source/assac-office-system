const aiService = require('../services/ai_service');

class AiController {
  /**
   * Get available AI models
   * GET /api/ai/models
   */
  async getModels(req, res) {
    try {
      const models = aiService.getAvailableModels();
      res.json({ success: true, data: models });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Check Cloudflare Workers AI connection status
   * GET /api/ai/status
   */
  async getStatus(req, res) {
    try {
      const status = await aiService.checkStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Chat completion endpoint
   * POST /api/ai/chat
   */
  async chatCompletion(req, res) {
    try {
      const { messages, model, systemPrompt, temperature, maxTokens } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ success: false, error: 'messages array is required' });
      }

      const result = await aiService.chatCompletion({
        messages,
        model,
        systemPrompt,
        temperature,
        maxTokens
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Image generation endpoint
   * POST /api/ai/image
   */
  async generateImage(req, res) {
    try {
      const { prompt, model, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'prompt is required' });
      }

      const result = await aiService.generateImage({ prompt, model, style });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Presentation generation endpoint
   * POST /api/ai/presentation
   */
  async generatePresentation(req, res) {
    try {
      const { topic, slideCount } = req.body;
      if (!topic) {
        return res.status(400).json({ success: false, error: 'topic is required' });
      }

      const result = await aiService.generatePresentation({ topic, slideCount });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AiController();
