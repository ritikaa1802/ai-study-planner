export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const { goal } = (await req.json()) as { goal?: string };

    if (!goal || !goal.trim()) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 });
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
      return NextResponse.json(
        {
          error: "Groq API request failed",
          details: errText,
        },
        { status: groqResponse.status }
      );
    }

    const payload = await groqResponse.json();
    const content: string | undefined = payload?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Groq response did not include content" }, { status: 502 });
    }

    const parsed = extractJsonPayload(content);
    return NextResponse.json(parsed, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to generate study plan" }, { status: 500 });
  }
}
