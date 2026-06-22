import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Lazy-initialize Gemini client to avoid crashing on start if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Server-side API endpoint for generating mindmap child nodes
app.post('/api/brainstorm', async (req, res) => {
  try {
    const { nodeText, contextText, promptType } = req.body;
    if (!nodeText) {
      return res.status(400).json({ error: 'nodeText is required' });
    }

    const ai = getGeminiClient();

    let prompt = '';
    let actionLabel = 'sub-topics';
    if (promptType === 'expand') {
      prompt = `Brainstorm and generate 4 distinct, highly creative, and actionable sub-topics or extension ideas related to: "${nodeText}". Consider this general context: "${contextText || 'General brainstorming'}".`;
      actionLabel = 'extension ideas';
    } else if (promptType === 'pros_cons') {
      prompt = `Analyze "${nodeText}" and generate 4 nodes. 2 should be key advantages/pros, and 2 should be key challenges/cons. Consider this context: "${contextText || 'None'}".`;
      actionLabel = 'advantages and challenges';
    } else if (promptType === 'next_steps') {
      prompt = `Propose 4 concrete, sequential, and highly actionable next steps for implementing the idea: "${nodeText}". Context: "${contextText || 'None'}".`;
      actionLabel = 'implementation steps';
    } else {
      prompt = `Generate 4 relevant extension ideas, questions, or perspectives for: "${nodeText}". Context: "${contextText || 'None'}".`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an elite creative brainstorming assistant. You help users breakdown, expand, and structure complex ideas into clear mind map nodes. Your output must be valid JSON matching the requested schema. Make the ideas specific, concise, punchy, and highly relevant. Keep each generated idea title under 4 words, and descriptive text under 10 words so they fit perfectly in visual nodes. Choose an appropriate tier color matching the child idea's nature (e.g. green for positive/pros, rose for challenges/cons, purple for innovative, blue for strategic, amber for action items, cyan for support).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["ideas"],
          properties: {
            ideas: {
              type: Type.ARRAY,
              description: "The list of brainstormed ideas or sub-nodes.",
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "color"],
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "The highly concise punchy label of the node (maximum 4 words).",
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short, single-sentence explanatory detail (maximum 10 words).",
                  },
                  color: {
                    type: Type.STRING,
                    description: "Border/background theme color class: 'blue', 'green', 'amber', 'purple', 'rose', or 'cyan'."
                  }
                }
              }
            }
          }
        }
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const data = JSON.parse(textOutput);
    res.json(data);
  } catch (error: any) {
    console.error('Brainstorm API error:', error);
    res.status(500).json({ error: error.message || 'Brainstorming failed' });
  }
});

// Vite Integration
if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, import Vite dev server and load as middleware
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
