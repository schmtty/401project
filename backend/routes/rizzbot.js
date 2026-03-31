/**
 * RizzBot API - LLM-powered texting feedback
 *
 * Uses Google Gemini (gemini-2.0-flash-lite) when GOOGLE_AI_API_KEY is set in the environment.
 * When the API key is absent the route returns 503 with { fallback: true } so the frontend
 * can display a rule-based fallback instead of an error.
 *
 * Requires X-User-Id header (enforced by requireUserId middleware).
 *
 * Endpoint:
 *   POST /api/rizzbot
 *     Body: {
 *       connection:   { name: string, ...milestones, relationship? }
 *       objective:    string   - what the user is trying to accomplish with the message
 *       userMessage?: string   - the draft text to critique (omit for starter suggestions)
 *       context?:    {
 *         connectionNotes?:  string
 *         eventSummaries?:   { title, type, notes }[]
 *         upcomingEvents?:   { title, date }[]
 *         milestones?:       { dates, heldHands, kissed }
 *         relationship?:     string
 *       }
 *     }
 */
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireUserId } from '../middleware/userId.js';

const router = express.Router();
router.use(requireUserId);

const API_KEY = process.env.GOOGLE_AI_API_KEY;

/**
 * Build the system prompt sent to Gemini, injecting personalized context about
 * the connection (notes, shared events, milestones) so the AI can give relevant advice.
 * Context fields are each optional; missing ones are silently skipped.
 * @param {object} connection - Connection object from the request (must have .name).
 * @param {string} objective - What the user wants to achieve with their message.
 * @param {object} ctx - Optional context: connectionNotes, eventSummaries, upcomingEvents, milestones, relationship.
 * @returns {string} Fully assembled system prompt string.
 */
function buildSystemPrompt(connection, objective, ctx) {
  const name = connection?.name || 'them';
  const parts = [
    `You are RizzBot, a helpful texting coach. The user is trying to craft a message to ${name}.`,
    `Their goal: ${objective}.`,
    '',
    'Give constructive, specific feedback on their draft. Start with 1-2 observations (what works, what to improve), then offer 1-2 tailored suggestions. Be concise (2-4 sentences).',
    '',
  ];

  if (ctx.connectionNotes) {
    parts.push(`Notes about ${name}: "${ctx.connectionNotes}"`);
    parts.push('');
  }
  if (ctx.eventSummaries?.length > 0) {
    const withNotes = ctx.eventSummaries.filter((e) => e.notes?.trim());
    if (withNotes.length > 0) {
      parts.push('Event notes (use these to personalize):');
      withNotes.slice(0, 3).forEach((e) => {
        parts.push(`- ${e.title} (${e.type}): ${e.notes.slice(0, 100)}`);
      });
      parts.push('');
    }
  }
  if (ctx.upcomingEvents?.length > 0) {
    const next = ctx.upcomingEvents[0];
    parts.push(`Upcoming event with ${name}: "${next.title}" on ${next.date}. Consider referencing it.`);
    parts.push('');
  }
  if (ctx.milestones) {
    const m = ctx.milestones;
    if (m.dates > 0) parts.push(`They've been on ${m.dates} date(s) together.`);
    if (m.heldHands || m.kissed) parts.push('Relationship has escalated (held hands/kissed).');
    if (ctx.relationship) parts.push(`Relationship type: ${ctx.relationship}`);
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * POST /api/rizzbot
 * Accept a connection, objective, optional draft message, and context; return AI coaching text.
 * Returns 503 with { fallback: true } when GOOGLE_AI_API_KEY is not configured.
 */
router.post('/', async (req, res) => {
  try {
    const { connection, objective, userMessage, context } = req.body;

    if (!connection?.name || !objective) {
      return res.status(400).json({ error: 'connection.name and objective are required' });
    }

    if (!API_KEY) {
      return res.status(503).json({
        error: 'RizzBot AI is not configured',
        fallback: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const systemPrompt = buildSystemPrompt(connection, objective, context || {});
    const userPrompt = userMessage?.trim()
      ? `User's draft: "${userMessage}"\n\nGive your feedback:`
      : 'User has no draft yet. Give them 1-2 tailored message ideas to get started.';

    const fullPrompt = `${systemPrompt}\n---\n${userPrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: fullPrompt,
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    res.json({ text });
  } catch (err) {
    console.error('POST /api/rizzbot error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate feedback',
      fallback: true,
    });
  }
});

export default router;
