/**
 * ASSAC Cloudflare Workers AI Integration Service
 * Powers the Open WebUI AI Utility Suite using Cloudflare Workers AI.
 * 
 * Default Model: @cf/meta/llama-3.1-8b-instruct
 */

function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Cloudflare Workers AI credentials missing. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your .env file.');
  }
  return {
    accountId,
    token,
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`
  };
}

const AVAILABLE_MODELS = [
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Meta',
    category: 'General & Technical',
    description: 'High intelligence flagship open model for coding, analysis, and administrative drafting.',
    context_length: 8192,
    isDefault: true
  },
  {
    id: '@cf/meta/llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    provider: 'Meta',
    category: 'General Chat',
    description: 'Ultra-fast language model for conversational tasks.',
    context_length: 8192,
    isDefault: false
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    name: 'Mistral 7B Instruct v0.1',
    provider: 'Mistral AI',
    category: 'Reasoning & Summarization',
    description: 'Specialized for structured formatting, memo analysis, and summarization.',
    context_length: 4096,
    isDefault: false
  },
  {
    id: '@cf/qwen/qwen1.5-7b-chat-awq',
    name: 'Qwen 1.5 7B Chat',
    provider: 'Alibaba Cloud',
    category: 'Multilingual & Code',
    description: 'Exceptional coding and multilingual reasoning engine.',
    context_length: 8192,
    isDefault: false
  },
  {
    id: '@cf/deepseek-ai/deepseek-math-7b-instruct',
    name: 'DeepSeek Math 7B',
    provider: 'DeepSeek',
    category: 'Mathematics & Analytics',
    description: 'Trained on deep mathematical reasoning and numerical dataset analysis.',
    context_length: 4096,
    isDefault: false
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL 1.0',
    provider: 'Stability AI',
    category: 'Image Generation',
    description: 'Photorealistic and high-resolution technical diagrams & illustration generator.',
    isDefault: false
  }
];

class AiService {
  /**
   * Helper to make authenticated requests to Cloudflare Workers AI
   */
  async runModel(modelId, payload, isBinary = false) {
    const { token, baseUrl } = getCredentials();
    const url = `${baseUrl}/${modelId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.errors ? JSON.stringify(errorJson.errors) : JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(`Cloudflare AI Error (${response.status}): ${errorDetail}`);
    }

    if (isBinary) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    }

    const data = await response.json();
    return data;
  }

  /**
   * Chat completion endpoint using Llama 3.1 / selected model
   */
  async chatCompletion({ 
    messages = [], 
    model = '@cf/meta/llama-3.1-8b-instruct',
    systemPrompt = 'You are the ASSAC Enterprise Neural Assistant, an intelligent AI dedicated to Assam State Space Application Centre. You assist scientific officers, administrative staff, and interns with technical drafting, satellite & GIS query explanations, official memorandum writing, python code analysis, and intranet productivity.',
    temperature = 0.6,
    maxTokens = 2048
  }) {
    // Ensure system prompt is present
    const formattedMessages = [];
    if (systemPrompt && !messages.some(m => m.role === 'system')) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    // Append history
    messages.forEach(m => {
      formattedMessages.push({
        role: m.role || 'user',
        content: m.content || m.text || ''
      });
    });

    const payload = {
      messages: formattedMessages,
      temperature: Number(temperature) || 0.6,
      max_tokens: Number(maxTokens) || 2048
    };

    const data = await this.runModel(model, payload);
    
    let text = '';
    if (data.result) {
      if (typeof data.result.response === 'string') {
        text = data.result.response;
      } else if (data.result.choices && data.result.choices[0] && data.result.choices[0].message) {
        text = data.result.choices[0].message.content;
      }
    }

    return {
      success: true,
      model,
      text: text || 'No response generated from model.',
      usage: data.result ? data.result.usage : null,
      raw: data.result
    };
  }

  /**
   * Text-to-Image Generation using Stable Diffusion XL
   */
  async generateImage({ 
    prompt, 
    model = '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    style = 'Technical Vector'
  }) {
    if (!prompt) throw new Error('Image prompt is required');

    // Enhance prompt based on style
    let enhancedPrompt = prompt;
    if (style === 'Technical Vector') {
      enhancedPrompt = `${prompt}, technical vector graphics, clean lines, GIS satellite diagram, flat style, sharp details, 8k resolution, professional emblem`;
    } else if (style === 'Photorealistic') {
      enhancedPrompt = `${prompt}, photorealistic, ultra-detailed, satellite imagery view, high dynamic range, natural lighting, cinematic 8k`;
    } else if (style === 'Orbital View') {
      enhancedPrompt = `${prompt}, orbital space perspective, earth curvature, solar reflection, deep space, high contrast, NASA satellite photograph`;
    }

    const payload = { prompt: enhancedPrompt };
    const buffer = await this.runModel(model, payload, true);
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Data}`;

    return {
      success: true,
      prompt,
      enhancedPrompt,
      style,
      model,
      dataUrl,
      sizeBytes: buffer.length
    };
  }

  /**
   * Generate Multi-Slide Presentation Deck using Llama 3.1 JSON structured output
   */
  async generatePresentation({ topic, slideCount = 5 }) {
    if (!topic) throw new Error('Presentation topic is required');

    const prompt = `You are an expert executive presentation designer for Assam State Space Application Centre (ASSAC).
Create an authoritative, highly professional slide deck with exactly ${slideCount} slides for the topic: "${topic}".

You MUST respond strictly with a valid JSON object matching this exact schema:
{
  "topic": "${topic}",
  "slidesCount": ${slideCount},
  "slides": [
    {
      "number": 1,
      "title": "Short Impactful Slide Title",
      "subtitle": "Subtitle or context description",
      "bullets": [
        "First key analytical takeaway or observation",
        "Second measurable metric or progress indicator",
        "Third actionable directive or next milestone"
      ]
    }
  ]
}

DO NOT include markdown code fences (\`\`\`json). Output pure JSON only.`;

    const result = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: 'You output only valid raw JSON. Never output markdown fences or explanatory conversational text.',
      temperature: 0.3
    });

    let rawText = result.text.trim();
    // Strip markdown code fences if model included them
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    try {
      const parsed = JSON.parse(rawText);
      return { success: true, deck: parsed };
    } catch {
      // Fallback fallback structured deck if JSON parse fails
      return {
        success: true,
        deck: {
          topic,
          slidesCount: slideCount,
          slides: [
            {
              number: 1,
              title: `Executive Briefing: ${topic}`,
              subtitle: "Assam State Space Application Centre",
              bullets: [
                "Overview of GIS mapping, earth observation, and spatial analytics",
                "Internal operational milestones and data governance status",
                "Key technical priorities and project lifecycle roadmap"
              ]
            },
            {
              number: 2,
              title: "Strategic Overview & Field Deployment",
              bullets: [
                "Satellite telemetry ingested across Brahmaputra monitoring sectors",
                "Workforce engagement metrics aligned with state objectives",
                "Cloud computing & AI assisted classification pipelines"
              ]
            }
          ]
        }
      };
    }
  }

  /**
   * Return available models list
   */
  getAvailableModels() {
    return AVAILABLE_MODELS;
  }

  /**
   * Check connection status to Cloudflare Workers AI
   */
  async checkStatus() {
    try {
      const { accountId } = getCredentials();
      const test = await this.chatCompletion({
        messages: [{ role: 'user', content: 'Ping' }],
        maxTokens: 5
      });
      return {
        online: true,
        provider: 'Cloudflare Workers AI',
        accountId: (accountId || '').slice(0, 8) + '...',
        defaultModel: '@cf/meta/llama-3.1-8b-instruct'
      };
    } catch (err) {
      return {
        online: false,
        provider: 'Cloudflare Workers AI',
        error: err.message
      };
    }
  }
}

module.exports = new AiService();
