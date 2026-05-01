import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODE_GUIDANCE = {
  Business:
    "Focus on business impact, stakeholders, operating model, ROI, risks, and measurable rollout milestones.",
  Coding:
    "Focus on technical architecture, implementation details, APIs, testing, maintainability, and deployment.",
  Strategy:
    "Focus on market context, decision tradeoffs, sequencing, resourcing, adoption, and executive clarity."
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    problemUnderstanding: {
      type: "string",
      description: "A concise restatement of the user's request and the real-world problem to solve."
    },
    suggestedSolution: {
      type: "string",
      description: "A practical solution recommendation tailored to the selected mode."
    },
    stepByStepPlan: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "string"
      }
    },
    optionalCodeExample: {
      type: "string",
      description: "A short code, config, prompt, or pseudo-code example when useful. Return an empty string if not useful."
    }
  },
  required: [
    "problemUnderstanding",
    "suggestedSolution",
    "stepByStepPlan",
    "optionalCodeExample"
  ]
};

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Only POST requests are supported." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, {
      error: "OPENAI_API_KEY is not configured for this deployment."
    });
  }

  try {
    const { prompt, mode = "Business" } = req.body || {};
    const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const selectedMode = MODE_GUIDANCE[mode] ? mode : "Business";

    if (!trimmedPrompt) {
      return sendJson(res, 400, { error: "Please enter a problem or request." });
    }

    if (trimmedPrompt.length > 4000) {
      return sendJson(res, 413, {
        error: "Please keep requests under 4,000 characters for this demo."
      });
    }

    const startedAt = Date.now();

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You are an AI deployment consultant. Return realistic, specific, production-minded guidance for an AI Deployment Engineer portfolio demo. Avoid hype and keep recommendations actionable."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Mode: ${selectedMode}\nMode guidance: ${MODE_GUIDANCE[selectedMode]}\n\nUser request:\n${trimmedPrompt}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "deployment_console_response",
          strict: true,
          schema: responseSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text);

    // Log lightweight operational metadata without storing sensitive prompt text.
    console.info("AI request completed", {
      mode: selectedMode,
      responseId: response.id,
      latencyMs: Date.now() - startedAt
    });

    return sendJson(res, 200, {
      result: parsed,
      meta: {
        mode: selectedMode,
        responseId: response.id,
        latencyMs: Date.now() - startedAt
      }
    });
  } catch (error) {
    console.error("AI request failed", {
      message: error.message,
      status: error.status,
      type: error.type
    });

    return sendJson(res, error.status || 500, {
      error:
        error.status === 401
          ? "OpenAI authentication failed. Check your API key."
          : "The AI service could not complete the request. Please try again."
    });
  }
}
