/**
 * llm.js — LLM 出題服務模組
 * 支援 OpenAI / Google Gemini / Anthropic Claude
 * 環境變數：LLM_PROVIDER, OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY
 */

const SYSTEM_PROMPT = `你是一位專業的臺灣國中數理資優班出題老師，負責出高品質的繁體中文考題。
請根據使用者的要求，輸出指定數量的題目，格式為 JSON 陣列，每個物件包含以下欄位：
- content: 題目內容（字串，必填）
- option_a, option_b, option_c, option_d: 選項（字串，僅選擇題填寫，其他題型留 null）
- answer: 答案（選擇題填 A/B/C/D，填空題填標準答案字串）
- explanation: 詳解（字串，建議填寫）
- tags: 關鍵字標籤，以逗號分隔（字串，例如："方程式,一元一次"）
只輸出純 JSON 陣列，不要有任何前後文說明。`;

/**
 * 呼叫 LLM 生成考題
 * @param {string} provider - 'openai' | 'gemini' | 'claude'
 * @param {string} userPrompt - 描述出題需求的提示詞
 * @returns {Promise<Array>} 題目物件陣列
 */
async function generateQuestions(provider, userPrompt) {
  switch (provider) {
    case 'openai':  return callOpenAI(userPrompt);
    case 'gemini':  return callGemini(userPrompt);
    case 'claude':  return callClaude(userPrompt);
    default: throw new Error(`不支援的 LLM provider: ${provider}`);
  }
}

async function callOpenAI(userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 未設定');

  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices[0].message.content;
  return parseJsonResponse(raw);
}

async function callGemini(userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 未設定');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
  });

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
  const result = await model.generateContent(fullPrompt);
  const raw = result.response.text();
  return parseJsonResponse(raw);
}

async function callClaude(userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 未設定');

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey });

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const raw = message.content[0].text;
  return parseJsonResponse(raw);
}

/**
 * 解析 LLM 回傳的 JSON（可能是陣列或包含陣列的物件）
 */
function parseJsonResponse(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 嘗試從回應中擷取 JSON 區段
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('LLM 回傳內容無法解析為 JSON');
    parsed = JSON.parse(match[0]);
  }
  // 若是物件包陣列（如 { questions: [...] }），取第一個陣列值
  if (Array.isArray(parsed)) return parsed;
  const arr = Object.values(parsed).find(v => Array.isArray(v));
  if (arr) return arr;
  throw new Error('LLM 回傳格式不符預期，未找到題目陣列');
}

module.exports = { generateQuestions };
