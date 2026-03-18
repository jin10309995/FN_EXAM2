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
- 若題型為是非題，題目應為單一敘述句，answer 只能填 T 或 F，選項欄位留 null
- 若題型為選擇題，請務必提供完整四個選項，且 answer 只能是 A/B/C/D
- 若題型為填空題，請直接提供標準答案與解析
- 題目內容、選項、解析一律使用自然的繁體中文純文字
- 不要使用 LaTeX、不要使用 Markdown 數學語法、不要輸出 \$、\\overline、\\ne、\\frac、上下標等符號格式
- 數學式請改寫成一般可讀文字，例如「3x + 5 = 17」、「A不等於0」、「三位數 ABC」
只輸出純 JSON 陣列，不要有任何前後文說明。`;

/**
 * 呼叫 LLM 生成考題
 * @param {string} provider - 'openai' | 'gemini' | 'claude'
 * @param {string} userPrompt - 描述出題需求的提示詞
 * @returns {Promise<Array>} 題目物件陣列
 */
async function generateQuestions(provider, userPrompt) {
  switch (provider) {
    case 'openai':  return callOpenAI(SYSTEM_PROMPT, userPrompt);
    case 'gemini':  return callGemini(SYSTEM_PROMPT, userPrompt);
    case 'claude':  return callClaude(SYSTEM_PROMPT, userPrompt);
    default: throw new Error(`不支援的 LLM provider: ${provider}`);
  }
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 未設定');

  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices[0].message.content;
  return parseJsonResponse(raw);
}

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 未設定');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
  });

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const result = await model.generateContent(fullPrompt);
  const raw = result.response.text();
  return parseJsonResponse(raw);
}

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 未設定');

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey });

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    system: systemPrompt,
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

// ────────────────────────────────────────────────────────────────────────────
// AI 作文批改
// ────────────────────────────────────────────────────────────────────────────

const GRADE_ESSAY_SYSTEM = `你是一位經驗豐富的國文／作文評審老師。
請依據提供的評分標準，對學生的作文從以下四個維度進行評分（四項合計即為百分制總分）：
- 內容主題（滿分 40 分）：立意是否明確、內容是否切題且具體充實
- 結構邏輯（滿分 25 分）：文章結構是否完整、段落層次是否分明
- 語言表達（滿分 25 分）：語句是否通順、用詞是否恰當、修辭是否得體
- 書寫規範（滿分 10 分）：標點符號、字數是否符合要求
請輸出 JSON 物件，格式如下：
{
  "dim_content": <整數，0~40，內容主題分>,
  "dim_structure": <整數，0~25，結構邏輯分>,
  "dim_language": <整數，0~25，語言表達分>,
  "dim_norms": <整數，0~10，書寫規範分>,
  "notes": "<評語字串，繁體中文，150字以內，針對四個維度分別說明給分理由及改進建議>"
}
只輸出純 JSON 物件，不要有任何前後文說明。`;

/**
 * AI 批改作文
 * @param {string} provider
 * @param {string} questionContent - 作文題目
 * @param {string} studentAnswer   - 學生作文
 * @param {string} rubric          - 評分標準（存在 questions.answer 欄位）
 * @param {number} maxScore        - 滿分
 * @returns {Promise<{score:number, notes:string}>}
 */
async function gradeEssay(provider, questionContent, studentAnswer, rubric, maxScore) {
  const userPrompt = `【作文題目】\n${questionContent}\n\n【評分標準】\n${rubric || '依文章立意、結構、語言表達整體評分'}\n\n【滿分】${maxScore} 分（換算自百分制總分）\n\n【學生作文】\n${studentAnswer}`;
  let raw;
  switch (provider) {
    case 'openai':  raw = await callOpenAIText(GRADE_ESSAY_SYSTEM, userPrompt); break;
    case 'gemini':  raw = await callGeminiText(GRADE_ESSAY_SYSTEM, userPrompt); break;
    case 'claude':  raw = await callClaudeText(GRADE_ESSAY_SYSTEM, userPrompt); break;
    default: throw new Error(`不支援的 LLM provider: ${provider}`);
  }
  let result;
  try { result = JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI 批改回傳格式錯誤');
    result = JSON.parse(m[0]);
  }
  const dimContent   = Math.min(Math.max(Math.round(parseFloat(result.dim_content)   || 0), 0), 40);
  const dimStructure = Math.min(Math.max(Math.round(parseFloat(result.dim_structure) || 0), 0), 25);
  const dimLanguage  = Math.min(Math.max(Math.round(parseFloat(result.dim_language)  || 0), 0), 25);
  const dimNorms     = Math.min(Math.max(Math.round(parseFloat(result.dim_norms)     || 0), 0), 10);
  const total100 = dimContent + dimStructure + dimLanguage + dimNorms;
  const score = Math.round(total100 / 100 * maxScore * 2) / 2; // 四捨五入至 0.5
  return { score, notes: String(result.notes || ''), dim_content: dimContent, dim_structure: dimStructure, dim_language: dimLanguage, dim_norms: dimNorms };
}

// ────────────────────────────────────────────────────────────────────────────
// AI 範文產生
// ────────────────────────────────────────────────────────────────────────────

/**
 * AI 產生示範作文
 * @param {string} provider
 * @param {string} questionContent - 作文題目
 * @param {string} gradeLevel      - 學段（elementary_6/grade_7/grade_8/grade_9/bctest）
 * @returns {Promise<string>} 純文字範文
 */
async function generateModelEssay(provider, questionContent, gradeLevel) {
  const levelMap = {
    elementary_6: '國小六年級', grade_7: '國一（七年級）',
    grade_8: '國二（八年級）', grade_9: '國三（九年級）', bctest: '國中會考'
  };
  const levelLabel = levelMap[gradeLevel] || '國中';
  const systemPrompt = `你是一位優秀的國文老師，擅長寫作${levelLabel}程度的示範作文。請用流暢、自然的繁體中文寫出一篇高品質的示範作文，符合該學段學生應有的語言程度。直接輸出作文正文，不需要標題、說明文字或任何前後文。`;
  const userPrompt = `請依照以下題目，寫一篇約 300~500 字的示範作文：\n\n${questionContent}`;
  switch (provider) {
    case 'openai':  return callOpenAIText(systemPrompt, userPrompt);
    case 'gemini':  return callGeminiText(systemPrompt, userPrompt);
    case 'claude':  return callClaudeText(systemPrompt, userPrompt);
    default: throw new Error(`不支援的 LLM provider: ${provider}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 通用純文字 LLM 呼叫（不強制 JSON 格式）
// ────────────────────────────────────────────────────────────────────────────

async function callOpenAIText(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 未設定');
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    temperature: 0.7
  });
  return response.choices[0].message.content;
}

async function callGeminiText(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY 未設定');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.7 }
  });
  const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
  return result.response.text();
}

async function callClaudeText(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 未設定');
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey });
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });
  return message.content[0].text;
}

module.exports = { generateQuestions, gradeEssay, generateModelEssay };
