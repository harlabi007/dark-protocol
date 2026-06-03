export type QualityScore = {
  overall: number;
  completeness: number;
  clarity: number;
  usability: number;
  freshness: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
};

export async function scoreDataset(
  title: string,
  description: string,
  fileName: string,
  fileSize: number
): Promise<QualityScore> {
  console.log("scoring...");

  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  console.log("key starts with:", key?.slice(0, 10));

  const response = await fetch("/api/score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a data quality analyst. Analyse this dataset and return ONLY valid JSON, no extra text.

Title: ${title}
Description: ${description}
File: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)

Return exactly this JSON structure:
{
  "overall": 8,
  "completeness": 8,
  "clarity": 9,
  "usability": 7,
  "freshness": 8,
  "summary": "brief quality summary here",
  "strengths": ["strength one", "strength two"],
  "weaknesses": ["weakness one", "weakness two"]
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("API error:", response.status, err);
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as QualityScore;
}