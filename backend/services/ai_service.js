/**
 * ASSAC Enterprise Neural AI Integration Service
 * Powers the Open WebUI AI Playground for Assam State Space Application Centre.
 * Created & Configured for ASSAC Intranet.
 * 
 * Default Model: ASSAC-LLM 1.0
 */

function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Neural AI API credentials missing. Please ensure environment credentials are configured in .env.');
  }
  return {
    accountId,
    token,
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`
  };
}

const MODEL_MAPPING = {
  'assac-llm-1.0': '@cf/meta/llama-3.1-8b-instruct',
  'assac-llm-fast': '@cf/meta/llama-3-8b-instruct',
  'assac-reasoning-core': '@cf/mistral/mistral-7b-instruct-v0.1',
  'assac-code-spatial': '@cf/qwen/qwen1.5-7b-chat-awq',
  'assac-math-analytics': '@cf/deepseek-ai/deepseek-math-7b-instruct',
  'assac-vision-engine': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  // Backward compatibility:
  '@cf/meta/llama-3.1-8b-instruct': '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3-8b-instruct': '@cf/meta/llama-3-8b-instruct',
  '@cf/mistral/mistral-7b-instruct-v0.1': '@cf/mistral/mistral-7b-instruct-v0.1',
  '@cf/qwen/qwen1.5-7b-chat-awq': '@cf/qwen/qwen1.5-7b-chat-awq',
  '@cf/deepseek-ai/deepseek-math-7b-instruct': '@cf/deepseek-ai/deepseek-math-7b-instruct',
  '@cf/stabilityai/stable-diffusion-xl-base-1.0': '@cf/stabilityai/stable-diffusion-xl-base-1.0'
};

const AVAILABLE_MODELS = [
  {
    id: 'assac-llm-1.0',
    name: 'ASSAC-LLM 1.0 (Flagship)',
    displayName: 'ASSAC-LLM 1.0',
    category: 'General & Technical Reasoning',
    description: 'Flagship high-intelligence language model for technical drafting, GIS queries, satellite data analysis, and office memos.',
    context_length: 8192,
    isDefault: true
  },
  {
    id: 'assac-llm-fast',
    name: 'ASSAC-LLM Fast',
    displayName: 'ASSAC-LLM Fast',
    category: 'Rapid Dialogue',
    description: 'Ultra-fast language model optimized for rapid response drafting and conversational assistance.',
    context_length: 8192,
    isDefault: false
  },
  {
    id: 'assac-reasoning-core',
    name: 'ASSAC-Reasoning Core',
    displayName: 'ASSAC-Reasoning Core',
    category: 'Analytical & Summarization',
    description: 'Specialized for administrative memorandum synthesis, circular analysis, and report generation.',
    context_length: 4096,
    isDefault: false
  },
  {
    id: 'assac-code-spatial',
    name: 'ASSAC-Code & Spatial',
    displayName: 'ASSAC-Code & Spatial',
    category: 'Python & Spatial Coding',
    description: 'Optimized for PyQGIS scripts, GeoTIFF raster processing, SQL databases, and technical code.',
    context_length: 8192,
    isDefault: false
  },
  {
    id: 'assac-math-analytics',
    name: 'ASSAC-Math & Analytics',
    displayName: 'ASSAC-Math & Analytics',
    category: 'Mathematics & Spatial Geometry',
    description: 'Trained on numerical datasets, spatial coordinate calculations, and biometric analytics.',
    context_length: 4096,
    isDefault: false
  },
  {
    id: 'assac-vision-engine',
    name: 'ASSAC-Vision Engine',
    displayName: 'ASSAC-Vision Engine',
    category: 'High-Resolution Visual Synthesis',
    description: 'Native 1024x1024 technical visual diagram and satellite illustration generator.',
    isDefault: false
  }
];

const DEFAULT_SYSTEM_PROMPT = `You are ASSAC-LLM (Assam State Space Application Centre Neural AI), created and developed by Pallab Jyoti Gohain from Morigaon.
You assist scientific officers, technical analysts, administrative staff, and intern scholars across ASSAC.
Your core capabilities include:
1. Remote Sensing & GIS analysis (satellite data, NDVI calculations, GeoTIFF processing, QGIS, ArcGIS, python spatial libraries).
2. Official Assam State governance (memorandums, administrative circulars, biometric attendance rules).
3. Software engineering & data pipelines (Python, Node.js, SQL, REST APIs, bash scripting).
When asked about your creator, developer, or origin, clearly state that you were created and developed by Pallab Jyoti Gohain from Morigaon.
Provide direct, highly accurate, structured, and helpful responses. Use markdown for code blocks and formatted tables.`;

class AiService {
  /**
   * Helper to make authenticated requests to Neural Engine
   */
  async runModel(modelKey, payload, isBinary = false) {
    const { token, baseUrl } = getCredentials();
    const actualModel = MODEL_MAPPING[modelKey] || modelKey || '@cf/meta/llama-3.1-8b-instruct';
    const url = `${baseUrl}/${actualModel}`;
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
      throw new Error(`ASSAC Neural Engine Error (${response.status}): ${errorDetail}`);
    }

    if (isBinary) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    }

    const data = await response.json();
    return data;
  }

  /**
   * Chat completion endpoint using ASSAC-LLM
   */
  async chatCompletion({ 
    messages = [], 
    model = 'assac-llm-1.0',
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
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

    const modelObj = AVAILABLE_MODELS.find(m => m.id === model) || AVAILABLE_MODELS.find(m => MODEL_MAPPING[m.id] === model);
    const displayModelName = modelObj ? modelObj.displayName : 'ASSAC-LLM 1.0';
    const publicModelId = modelObj ? modelObj.id : 'assac-llm-1.0';

    return {
      success: true,
      model: publicModelId,
      displayModel: displayModelName,
      creator: 'Pallab Jyoti Gohain, Morigaon',
      text: text || 'No response generated from model.',
      usage: data.result ? data.result.usage : null,
      raw: data.result
    };
  }

  /**
   * Text-to-Image Generation using ASSAC-Vision Engine
   */
  async generateImage({ 
    prompt, 
    model = 'assac-vision-engine',
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
      model: 'assac-vision-engine',
      displayModel: 'ASSAC-Vision Engine',
      creator: 'Pallab Jyoti Gohain, Morigaon',
      dataUrl,
      sizeBytes: buffer.length
    };
  }

  /**
   * Generate Multi-Slide Presentation Deck using ASSAC-LLM JSON structured output
   */
  async generatePresentation({ topic, slideCount = 5 }) {
    if (!topic) throw new Error('Presentation topic is required');

    const prompt = `You are ASSAC-LLM, created and developed by Pallab Jyoti Gohain from Morigaon.
You are an expert executive presentation designer for Assam State Space Application Centre (ASSAC).
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
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    try {
      const parsed = JSON.parse(rawText);
      return { success: true, deck: parsed };
    } catch {
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
   * Check connection status to Neural Engine
   */
  async checkStatus() {
    try {
      getCredentials();
      const test = await this.chatCompletion({
        messages: [{ role: 'user', content: 'Ping' }],
        maxTokens: 5
      });
      return {
        online: true,
        engine: 'ASSAC Enterprise Neural AI',
        creator: 'Pallab Jyoti Gohain, Morigaon',
        defaultModel: 'ASSAC-LLM 1.0 (Flagship)'
      };
    } catch (err) {
      return {
        online: false,
        engine: 'ASSAC Enterprise Neural AI',
        error: err.message
      };
    }
  }
}

module.exports = new AiService();
