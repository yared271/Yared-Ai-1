import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '35mb' }));

// Initialize Google GenAI client according to AI Studio guidelines
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Primary and fallback models for high throughput and multimodal support
// gemini-3.1-flash-lite has active quota, high multimodal speed, and excellent Amharic language performance
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

// System instruction generator
const getSystemInstruction = (style: string = 'balanced', language: string = 'am') => {
  const baseInstruction = `
You are «ያሬድ AI (Yared AI)» - an elite, comprehensive, all-in-one AI Knowledge and Technology Assistant (ሁሉን አቀፍ የዕውቀት እና የቴክኖሎጂ ረዳት).
You have deep, authoritative knowledge across all major domains, with exceptional expertise in Ethiopian culture, history, geography, languages, and global science and technology:

1. CRITICAL MULTIMODAL VISION & PHOTO ANALYSIS (ፎቶዎችን እና ምስሎችን በጥልቀት የማንበብ እና የመረዳት ችሎታ)፦
   - Whenever an image or photo (ፎቶ፣ ስዕል፣ ሰነድ፣ ስክሪንሽት፣ የፈተና ጥያቄ፣ ደረሰኝ ወይም ንድፍ) is provided:
     a. You MUST thoroughly examine and read every visual and textual detail in the photo.
     b. If the image contains text (በአማርኛ፣ በግዕዝ፣ በእንግሊዝኛ፣ በቁጥሮች፣ በፎርሙላዎች ወይም በካሊግራፊ/እጅ ጽሑፍ) transcribe and interpret that text with 100% precision.
     c. If the user asks a specific question about the photo (በፎቶው ላይ የተጠየቀውን ጥያቄ): Answer and solve that exact question directly, step-by-step, with complete accuracy and reasoning.
     d. Describe visible diagrams, tables, charts, people, landmarks, or medical/technical indicators clearly.
     e. Never claim you cannot see or read images; you possess full, state-of-the-art multimodal vision capabilities.

2. CRITICAL MULTI-PART & MULTI-FACETED QUERY HANDLING (ሁሉንም የሚያማክል ጥያቄ ሲጠየቅ እያንዳንዱን ነጥብ የመመለስ ግዴታ)፦
   - When the user asks a question that spans multiple areas (e.g. comparing health, technology, history, athletics, economy, or multi-layered questions):
     a. You MUST address every single dimension, sub-question, and layer systematically without skipping, omitting, or glossing over any part!
     b. Structure your response with distinct, logical Markdown headings (##, ###) and structured bullet points for each requested domain.
     c. After analyzing each individual area, synthesize the overarching connections, mutual dependencies, and practical takeaways.

3. CRITICAL AMHARIC LINGUISTIC & DOCUMENT PERFECTION (እንከን-አልባ፣ ሚዛናዊና ፍጹም የአማርኛ አጻጻፍ - ማዘነፍ የሌለበት)፦
   - When communicating in Amharic (አማርኛ):
     a. Your Amharic must be of the highest literary, academic, and journalistic caliber (ፍጹም ጥራት ያለው፣ የሰዋሰው ስህተት የሌለው፣ ትክክለኛ የፊደል አገባብና ስርዓተ-ነጥብ ያለው)።
     b. Absolute objectivity, fairness, and balance: Do NOT show bias, favoritism, or distortion (ያለ ምንም ማዘነፍ ወይም አድልዎ፣ እውነታውን ያገናዘበ ሚዛናዊ ትንታኔ ስጥ)።
     c. Use correct Ge'ez punctuation marks (። ፣ ፤ ፦) appropriately.
     d. Avoid unnatural literal machine translations; use rich Ethiopian idiomatic phrasing, clear paragraphs, and publication-ready formatting.

4. CORE KNOWLEDGE DOMAINS:
   - ጤና እና ስነ-ምግብ (Health & Wellness): Evidence-based, responsible health & nutrition guidance.
   - ቴክኖሎጂ እና ኮዲንግ (Technology & Coding): Modern programming, algorithms, architecture, clean code blocks.
   - ስፖርት እና አትሌቲክስ (Sports & Athletics): Ethiopian athletic heritage, training, global football & sports.
   - ታሪክ፣ ቅርስ እና ባህል (History & Heritage): Deep Ethiopian civilizations (Aksum, Lalibela, Gondar, Adwa), manuscripts, world history.
   - ትምህርት እና ሳይንስ (Education & Science): Mathematics, Physics, Chemistry, Biology, step-by-step problem-solving.
   - ቢዝነስ እና ሥራ ፈጠራ (Business & Entrepreneurship): Startups, economics, digital marketing, strategic planning.
`;

  const styleDirectives: Record<string, string> = {
    balanced: `
STYLE DIRECTIVE: Balanced (ሚዛናዊ)
- Provide a clear, well-rounded, and thorough explanation.
- Combine intuitive explanations with practical examples, clear sections, and structured takeaways.`,
    deep_dive: `
STYLE DIRECTIVE: Deep Dive (ጥልቅ ትንታኔ)
- Provide exhaustive, academically rigorous, and comprehensive analysis.
- Detail historical context, underlying mechanisms, alternative viewpoints, case studies, and advanced implications.`,
    step_by_step: `
STYLE DIRECTIVE: Step-by-Step (ደረጃ በደረጃ)
- Format the response as numbered, chronological, actionable steps (1., 2., 3., ...).
- Include specific prerequisites, instructions for each phase, validation checkpoints, and common pitfalls to avoid.`,
    concise: `
STYLE DIRECTIVE: Concise & Direct (አጭርና ቀጥተኛ)
- Keep the answer crisp, high-signal, and straight to the point.
- Avoid unnecessary preambles. Highlight the essential answer immediately with bullet points.`,
    code_focus: `
STYLE DIRECTIVE: Code Focus (ኮዲንግ ሞድ)
- Prioritize clean, production-ready, modular code examples with syntax highlights.
- Include concise architectural breakdown, execution instructions, time/space complexity, and practical tips.`,
  };

  const selectedStyle = styleDirectives[style] || styleDirectives['balanced'];
  return `${baseInstruction}\n\n${selectedStyle}`;
};

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'ያሬድ AI (Yared AI) API',
    model: PRIMARY_MODEL,
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Audio speech-to-text transcription endpoint (AI-powered for high accuracy in Amharic & English)
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType = 'audio/webm', language = 'am' } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const cleanBase64 = audioData.includes('base64,')
      ? audioData.split('base64,')[1]
      : audioData;

    // Clean mime type to standard base form
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();

    const ai = getAiClient();
    const isAmharic = language === 'am';

    const promptText = isAmharic
      ? 'Listen carefully to this spoken audio. Transcribe the exact spoken words into clean, grammatically accurate Amharic (አማርኛ) or English (whichever language is spoken). Return ONLY the transcription text, nothing else. If there is no audible speech, reply with an empty string.'
      : 'Transcribe the exact words spoken in this audio into accurate text. Return ONLY the transcribed text. If there is no speech, reply with empty string.';

    let transcribedText = '';

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: cleanBase64,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
          },
        });

        transcribedText = (response.text || '').trim();
        if (transcribedText.toLowerCase().includes('no speech') || transcribedText === '""') {
          transcribedText = '';
        }
        if (transcribedText) {
          break; // Success
        }
      } catch (err: any) {
        console.warn(`Transcription attempt with ${model} failed, trying next...`, err?.message);
      }
    }

    res.json({ text: transcribedText });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    res.status(500).json({ error: error?.message || 'Transcription failed' });
  }
});

// Streaming Chat API via SSE with active model failover
app.post('/api/chat', async (req: Request, res: Response) => {
  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const { messages, style = 'balanced', language = 'am' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'No messages provided' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const ai = getAiClient();
    const systemInstruction = getSystemInstruction(style, language);

    // Format conversation history for Gemini API
    const contentsPayload = messages.map((m: any, index: number) => {
      const parts: any[] = [];
      const hasImage = m.attachments?.some((att: any) => att.mimeType?.startsWith('image/'));

      // Add attachments (images, text/code files)
      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.data && att.mimeType) {
            const cleanBase64 = att.data.includes('base64,')
              ? att.data.split('base64,')[1]
              : att.data;

            if (att.mimeType.startsWith('image/')) {
              // Standard clean image mime type (strip parameters like ;codecs=...)
              const cleanImageMime = att.mimeType.split(';')[0].trim() || 'image/jpeg';
              parts.push({
                inlineData: {
                  mimeType: cleanImageMime,
                  data: cleanBase64,
                },
              });
            } else {
              // Text or code file decoded
              try {
                const textContent = Buffer.from(cleanBase64, 'base64').toString('utf-8');
                parts.push({
                  text: `[Attached File: ${att.name || 'document'}]\n\`\`\`\n${textContent}\n\`\`\``,
                });
              } catch {
                parts.push({
                  inlineData: {
                    mimeType: att.mimeType,
                    data: cleanBase64,
                  },
                });
              }
            }
          }
        }
      }

      // Add text content with multimodal framing if image is present
      const userText = (m.content || '').trim();

      if (hasImage) {
        if (userText) {
          // Explicit prompt directing the AI to analyze the photo and answer the user question
          parts.push({
            text: language === 'am'
              ? `እባክዎ የተያያዘውን ፎቶ/ምስል በጥልቀት ተመልክተው፣ በውስጡ ያለውን ጽሑፍ፣ ቅርጽ ወይም መረጃ በማንበብ ለሚከተለው ጥያቄዬ የተሟላ፣ ትክክለኛና ጥልቅ መልስ ይስጡኝ፦\n\n«${userText}»`
              : `Please carefully examine the attached image, transcribe any text or equations, and provide a comprehensive answer to this question:\n\n"${userText}"`,
          });
        } else {
          // Image provided without text prompt
          parts.push({
            text: language === 'am'
              ? 'እባክዎ ይህንን ፎቶ/ምስል በጥልቀት ተመልክተው በውስጡ የሚታየውን ነገር፣ ጽሑፍ ካለ ሙሉውን ጽሑፍ አንብበው፣ እንዲሁም የተጠየቀ ጥያቄ ወይም ዋና መልዕክት ካለ በአማርኛ በዝርዝርና በግልጽ አስረዱኝ።'
              : 'Please thoroughly inspect this image, transcribe any visible text or formulas, and describe its details, key takeaways, and context.',
          });
        }
      } else if (userText) {
        parts.push({ text: userText });
      }

      // Ensure parts is never empty
      if (parts.length === 0) {
        parts.push({ text: language === 'am' ? 'ሰላም' : 'Hello' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });

    let streamSucceeded = false;
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      if (clientDisconnected) break;

      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: style === 'code_focus' ? 0.3 : style === 'deep_dive' ? 0.6 : 0.7,
          },
        });

        for await (const chunk of responseStream) {
          if (clientDisconnected) break;
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        streamSucceeded = true;
        break; // Successfully completed streaming!
      } catch (err: any) {
        console.warn(`Model ${model} stream error: ${err?.message}, checking fallback...`);
        lastError = err;
      }
    }

    if (!streamSucceeded && !clientDisconnected) {
      throw lastError || new Error('All models failed to respond.');
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error during /api/chat stream:', error);
    const errorMessage =
      error?.message || 'ያልተጠበቀ ስህተት ተከስቷል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Follow-up Suggestions Generator
app.post('/api/suggest-followups', async (req: Request, res: Response) => {
  const { userQuery = '', assistantResponse = '', language = 'am' } = req.body;
  const isAmharic = language === 'am';

  const defaultFollowups = isAmharic
    ? [
        'ተጨማሪ ዝርዝር ምሳሌዎችን አሳየኝ',
        'ይህንን በደረጃ በደረጃ እንዴት መተግበር ይቻላል?',
        'ዋና ዋና ጥቅሞቹና ተግዳሮቶቹ ምንድን ናቸው?',
      ]
    : [
        'Could you provide more real-world examples?',
        'What are the step-by-step implementation details?',
        'What are the main advantages and potential drawbacks?',
      ];

  if (!assistantResponse) {
    return res.json({ followups: defaultFollowups });
  }

  try {
    const ai = getAiClient();
    const prompt = `Based on the conversation below, propose exactly 3 natural, concise, interesting follow-up questions the user might ask next.
${isAmharic ? 'Write all 3 questions in Amharic (በአማርኛ).' : 'Write all 3 questions in English.'}
Keep each question under 10 words.
User Question: "${userQuery.slice(0, 300)}"
Assistant Answer Summary: "${assistantResponse.slice(0, 500)}"`;

    let followups: string[] = [];

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A concise follow-up question',
              },
            },
            temperature: 0.7,
          },
        });

        const parsed = JSON.parse(response.text || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          followups = parsed.slice(0, 3).map((item) => String(item).trim());
          break;
        }
      } catch (e) {
        // try next model
      }
    }

    if (followups.length === 0) {
      followups = defaultFollowups;
    }

    res.json({ followups });
  } catch (error: any) {
    console.error('Error generating follow-ups:', error);
    res.json({ followups: defaultFollowups });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ያሬድ AI (Yared AI) Server is running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
