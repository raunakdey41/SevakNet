'use strict';

/**
 * services/ai.js
 * Powered by Google Gemini (Generative AI)
 * 
 * Provides intelligent triage, categorization, and urgency scoring 
 * for citizen reports and field surveys.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Perform intelligent triage on a report/survey description.
 * Returns: { category, urgency_level, summary, suggested_title }
 */
async function triageReport(description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_key')) {
    console.warn('[AI] Gemini API Key missing. Using fallback logic.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an emergency response AI for SevakNet, a disaster management platform.
      Analyze the following field report/incident description from a citizen or volunteer.
      
      REPORT TEXT: "${description}"
      
      Classify this report and provide a response in STRICT JSON format:
      {
        "category": "Food" | "Medical" | "Infrastructure" | "Safety" | "Shelter" | "Other",
        "urgency_level": number (1-5, where 5 is critical/life-threatening),
        "summary": "1-sentence concise summary",
        "suggested_title": "Short 4-6 word catchy title"
      }

      Respond ONLY with the JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from potential markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (err) {
    console.error('[AI] Gemini Error:', err.message);
    return null;
  }
}

module.exports = { triageReport };
