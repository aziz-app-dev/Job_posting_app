import { GROQ_API_KEY } from "@/config/keys";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const MAX_SUGGESTION_CHARS = 300;

interface SuggestionResult {
  suggestions: string[];
  error: string | null;
}

export type SuggestionLength = "short" | "medium" | "long";

interface SuggestionOptions {
  /** Current text the user has already typed (may be empty). */
  draft?: string;
  /** Post title / role, e.g. "Product Designer". */
  title?: string;
  /** Topics/tags attached to the post. */
  topics?: string[];
  /** Whether this is a job listing (changes the tone/structure). */
  isJobPost?: boolean;
  /** Company name when it's a job post. */
  companyName?: string;
  /** How many variations to return. */
  count?: number;
  /** Desired length of each suggestion. */
  length?: SuggestionLength;
}

// Length presets → character budget + human guidance for the prompt.
const LENGTH_PRESETS: Record<
  SuggestionLength,
  { max: number; guidance: string }
> = {
  short: { max: 90, guidance: "Very short: one punchy sentence, under 90 characters." },
  medium: { max: 180, guidance: "Medium: 1-2 sentences, under 180 characters." },
  long: {
    max: MAX_SUGGESTION_CHARS,
    guidance: `Detailed: 3-4 sentences, up to ${MAX_SUGGESTION_CHARS} characters.`,
  },
};

// ─────────────────────────────────────────────────
// Generate post caption / description suggestions
// ─────────────────────────────────────────────────
export const generateCaptionSuggestions = async (
  options: SuggestionOptions = {}
): Promise<SuggestionResult> => {
  const {
    draft = "",
    title = "",
    topics = [],
    isJobPost = false,
    companyName = "",
    count = 3,
    length = "medium",
  } = options;

  const preset = LENGTH_PRESETS[length] ?? LENGTH_PRESETS.medium;

  if (!GROQ_API_KEY) {
    return {
      suggestions: [],
      error: "AI suggestions are not configured. Missing Groq API key.",
    };
  }

  const context: string[] = [];
  if (title) context.push(`Author role/title: ${title}`);
  if (topics.length) context.push(`Topics: ${topics.join(", ")}`);
  if (isJobPost) {
    context.push("This is a JOB LISTING post.");
    if (companyName) context.push(`Hiring company: ${companyName}`);
  }
  if (draft.trim()) context.push(`The user already started writing: "${draft.trim()}"`);

  const systemPrompt = isJobPost
    ? "You are an expert copywriter for a professional networking app. You write concise, engaging job-listing descriptions that attract qualified candidates."
    : "You are an expert social copywriter for a professional networking app. You write concise, engaging post captions that spark engagement.";

  const userPrompt = [
    `Write ${count} distinct ${isJobPost ? "job description" : "post caption"} suggestions.`,
    "Rules:",
    `- Length: ${preset.guidance}`,
    `- Every suggestion must stay under ${preset.max} characters.`,
    "- Vary the tone across suggestions (e.g. professional, friendly, punchy).",
    "- Do not use hashtags unless clearly helpful.",
    "- Return ONLY a JSON object of the form {\"suggestions\": [\"...\", \"...\"]}. No extra text.",
    "",
    context.length ? `Context:\n${context.join("\n")}` : "No extra context was provided; write general-purpose options.",
  ].join("\n");

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.log("Groq suggestion error:", response.status, detail);
      return {
        suggestions: [],
        error: `Failed to get suggestions (${response.status}).`,
      };
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    const suggestions = parseSuggestions(content, preset.max);
    if (!suggestions.length) {
      return { suggestions: [], error: "No suggestions were returned. Try again." };
    }

    return { suggestions, error: null };
  } catch (error: any) {
    console.log("Groq suggestion exception:", error);
    return {
      suggestions: [],
      error: error?.message || "Something went wrong generating suggestions.",
    };
  }
};

interface TopicResult {
  topics: string[];
  error: string | null;
}

interface TopicOptions {
  /** The post caption / description written so far. */
  caption?: string;
  /** Post title / role. */
  title?: string;
  /** Whether this is a job listing. */
  isJobPost?: boolean;
  /** Topics already chosen (so we don't repeat them). */
  existing?: string[];
  /** How many topics to return. */
  count?: number;
}

// ─────────────────────────────────────────────────
// Suggest relevant topics / tags for a post
// ─────────────────────────────────────────────────
export const generateTopicSuggestions = async (
  options: TopicOptions = {}
): Promise<TopicResult> => {
  const {
    caption = "",
    title = "",
    isJobPost = false,
    existing = [],
    count = 8,
  } = options;

  if (!GROQ_API_KEY) {
    return {
      topics: [],
      error: "AI suggestions are not configured. Missing Groq API key.",
    };
  }

  const context: string[] = [];
  if (title) context.push(`Title/role: ${title}`);
  if (isJobPost) context.push("This is a JOB LISTING post.");
  if (caption.trim()) context.push(`Post content: "${caption.trim()}"`);
  if (existing.length) context.push(`Already chosen (do not repeat): ${existing.join(", ")}`);

  const userPrompt = [
    `Suggest ${count} short, relevant topic tags for this professional post.`,
    "Rules:",
    "- Each topic is 1-3 words, no leading '#'.",
    "- Use Title Case.",
    "- Prefer widely-used, searchable terms (e.g. React Native, Hiring, Remote Work, UX Design).",
    "- Return ONLY a JSON object of the form {\"topics\": [\"...\", \"...\"]}. No extra text.",
    "",
    context.length ? `Context:\n${context.join("\n")}` : "No content was provided yet; suggest general professional-networking topics.",
  ].join("\n");

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that tags professional social posts with concise, discoverable topics.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.log("Groq topic error:", response.status, detail);
      return { topics: [], error: `Failed to get topics (${response.status}).` };
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    const topics = parseTopics(content, existing);
    if (!topics.length) {
      return { topics: [], error: "No topics were returned. Try again." };
    }

    return { topics, error: null };
  } catch (error: any) {
    console.log("Groq topic exception:", error);
    return {
      topics: [],
      error: error?.message || "Something went wrong generating topics.",
    };
  }
};

// Parse the model output into a clean, deduped list of topic strings.
const parseTopics = (content: string, existing: string[]): string[] => {
  if (!content) return [];

  let raw: string[] = [];
  try {
    const parsed = JSON.parse(content);
    const list = Array.isArray(parsed) ? parsed : parsed?.topics;
    if (Array.isArray(list)) {
      raw = list.map((item) => (typeof item === "string" ? item : String(item?.name ?? "")));
    }
  } catch {
    raw = content
      .split("\n")
      .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, ""));
  }

  const seen = new Set(existing.map((t) => t.toLowerCase()));
  const cleaned: string[] = [];
  for (const item of raw) {
    const topic = (item || "").replace(/^#/, "").trim();
    if (!topic) continue;
    if (topic.length > 30) continue;
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(topic);
  }
  return cleaned.slice(0, 12);
};

// Parse the model output into a clean list of caption strings.
const parseSuggestions = (
  content: string,
  maxChars: number = MAX_SUGGESTION_CHARS
): string[] => {
  if (!content) return [];

  // Try strict JSON first.
  try {
    const parsed = JSON.parse(content);
    const list = Array.isArray(parsed) ? parsed : parsed?.suggestions;
    if (Array.isArray(list)) {
      return list
        .map((item) => (typeof item === "string" ? item : String(item?.text ?? "")))
        .map((s) => cleanSuggestion(s, maxChars))
        .filter(Boolean)
        .slice(0, 5);
    }
  } catch {
    // fall through to lenient parsing
  }

  // Lenient fallback: split lines and strip list markers.
  return content
    .split("\n")
    .map((line) =>
      cleanSuggestion(line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, ""), maxChars)
    )
    .filter(Boolean)
    .slice(0, 5);
};

const cleanSuggestion = (
  raw: string,
  maxChars: number = MAX_SUGGESTION_CHARS
): string => {
  let text = (raw || "").trim();
  // Strip wrapping quotes the model sometimes adds.
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  const cap = Math.min(maxChars, MAX_SUGGESTION_CHARS);
  if (text.length > cap) {
    text = text.slice(0, cap).trim();
  }
  return text;
};
