import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const MODE_GUIDANCE = {
  Business:
    "Focus on business impact, stakeholders, operating model, ROI, risks, and measurable rollout milestones.",
  Coding:
    "Focus on technical architecture, implementation details, APIs, testing, maintainability, and deployment.",
  Strategy:
    "Focus on market context, decision tradeoffs, sequencing, resourcing, adoption, and executive clarity."
};

function buildPrompt(prompt, mode) {
  return `
Mode: ${mode}
Mode guidance: ${MODE_GUIDANCE[mode]}

User request:
${prompt}

Return the answer in this exact JSON format:
{
  "problemUnderstanding": "...",
  "suggestedSolution": "...",
  "stepByStepPlan": ["...", "...", "..."],
  "optionalCodeExample": "..."
}
`;
}

app.post("/api/ask", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured. Add it to .env.local."
    });
  }

  try {
    const { prompt, mode = "Business" } = req.body || {};
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const selectedMode = MODE_GUIDANCE[mode] ? mode : "Business";

    if (!trimmedPrompt) {
      return res.status(400).json({ error: "Please enter a problem or request." });
    }

    if (trimmedPrompt.length > 4000) {
      return res.status(413).json({
        error: "Please keep requests under 4,000 characters for this demo."
      });
    }

    const startedAt = Date.now();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI deployment consultant. Return realistic, specific, production-minded guidance for an AI Deployment Engineer portfolio demo. Return only valid JSON."
        },
        {
          role: "user",
          content: buildPrompt(trimmedPrompt, selectedMode)
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return res.status(200).json({
      result: parsed,
      meta: {
        mode: selectedMode,
        responseId: response.id,
        latencyMs: Date.now() - startedAt
      }
    });
  } catch (error) {
    console.error("Local AI request failed:", error);

    return res.status(500).json({
      error: "The local AI service could not complete the request. Check your API key and model."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Local AI Deployment Console running at http://localhost:${PORT}`);
});