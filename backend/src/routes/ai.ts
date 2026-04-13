import { Router, Request, Response } from "express";

const router = Router();

function extractJsonPayload(raw: string): unknown {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model response did not include valid JSON object.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

router.post("/ai", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("OPENROUTER RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "No reply found";

    return res.json({
      reply,
      full: data
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/generate-plan", async (req: Request, res: Response) => {
  try {
    const { goal } = req.body as { goal?: string };

    if (!goal || !goal.trim()) {
      return res.status(400).json({ error: "Goal is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
    }

    const systemPrompt = `You are an expert study planning assistant.
Return ONLY strict JSON with this shape:
{
  "goalTitle": "string",
  "duration": "string",
  "weeks": [
    {
      "week": number,
      "focusArea": "string",
      "intensity": number,
      "days": [
        {
          "day": "string",
          "tasks": [
            {
              "title": "string",
              "description": "string",
              "estimatedTime": "string",
              "priority": "high" | "medium" | "low"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Use 3 to 6 weeks based on goal complexity.
- Keep tasks practical, realistic, and specific.
- Keep intensity between 35 and 100.
- Do not include markdown, commentary, or code fences.`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a study plan for this goal: ${goal}` },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return res.status(groqResponse.status).json({
        error: "Groq API request failed",
        details: errText,
      });
    }

    const payload = await groqResponse.json();
    const content: string | undefined = payload?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: "Groq response did not include content" });
    }

    const parsed = extractJsonPayload(content);
    return res.json(parsed);
  } catch (error: any) {
    console.error("generate-plan error:", error);
    return res.status(500).json({ error: error?.message || "Failed to generate study plan" });
  }
});

export default router;