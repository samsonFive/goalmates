export type VisionResult = {
  provider: string;
  text: string;
  degraded: boolean;
  message?: string;
};

export interface VisionProvider {
  name: string;
  extract(input: { bytes?: Buffer; mimeType?: string; text?: string }): Promise<VisionResult>;
}

export class TextPassthroughProvider implements VisionProvider {
  name = "text";
  async extract(input: { text?: string }): Promise<VisionResult> {
    return { provider: this.name, text: input.text?.trim() ?? "", degraded: false };
  }
}

export class TesseractProvider implements VisionProvider {
  name = "tesseract";
  async extract(input: { bytes?: Buffer }): Promise<VisionResult> {
    if (!input.bytes?.length) {
      return {
        provider: this.name,
        text: "",
        degraded: true,
        message: "No image bytes were stored.",
      };
    }
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(input.bytes);
      await worker.terminate();
      const text = result.data.text.trim();
      if (!text) {
        return {
          provider: this.name,
          text: "",
          degraded: true,
          message: "Local OCR found no readable text. You can type items from the source image.",
        };
      }
      return { provider: this.name, text, degraded: false };
    } catch (error) {
      return {
        provider: this.name,
        text: "",
        degraded: true,
        message:
          error instanceof Error
            ? `Local OCR failed: ${error.message}`
            : "Local OCR failed unexpectedly.",
      };
    }
  }
}

export class OpenAIVisionProvider implements VisionProvider {
  name = "openai-vision";
  async extract(input: { bytes?: Buffer; mimeType?: string }): Promise<VisionResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return {
        provider: this.name,
        text: "",
        degraded: true,
        message: "OPENAI_API_KEY is not configured.",
      };
    }
    if (!input.bytes) {
      return { provider: this.name, text: "", degraded: true, message: "No image stored." };
    }
    const mime = input.mimeType || "image/jpeg";
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract planner items as plain lines. Preserve dates, times, and durations when visible. Do not invent items.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${input.bytes.toString("base64")}` },
            },
          ],
        },
      ],
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return {
        provider: this.name,
        text: "",
        degraded: true,
        message: `Vision provider returned HTTP ${response.status}.`,
      };
    }
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      provider: this.name,
      text: json.choices?.[0]?.message?.content?.trim() ?? "",
      degraded: false,
    };
  }
}

export function selectVisionProvider(sourceType: string): VisionProvider {
  if (sourceType === "text") return new TextPassthroughProvider();
  if (process.env.OPENAI_API_KEY) return new OpenAIVisionProvider();
  return new TesseractProvider();
}
