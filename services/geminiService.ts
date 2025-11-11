import { GoogleGenAI, Type } from "@google/genai";
import { AnnotationType, GeminiModel, type ScoreResponse } from '../types';

const GRADING_RUBRIC = `
- 1.0 (Excellent): The user's concept is the clear, unambiguous, primary subject. High technical quality (in focus, well-lit). Subject is not occluded. Neutral/unobtrusive background.
- 0.8 - 0.9 (Good): The concept is clear but may share focus or have minor occlusions. Good technical quality. A solid, usable training image.
- 0.6 - 0.7 (Average): The concept is present but may be small, part of a group, or in a "busy" scene. Still usable, but not ideal.
- 0.4 - 0.5 (Mediocre): The concept is present but heavily occluded, out of focus, or distant. Poor image quality (blurry, noise, watermarks, heavy text).
- 0.1 - 0.3 (Bad): The concept is technically present but not the subject (e.g., tiny in the background). Near-duplicate of another image.
- 0.0 (Very Bad): The concept is not present. The file is corrupted.
`;

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: GeminiModel.GeminiFlash,
            contents: 'hello',
        });
        return true;
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false;
    }
};

export const validateLmStudioServer = async (url: string): Promise<{ isValid: boolean; models: string[] }> => {
    if (!url) return { isValid: false, models: [] };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

    try {
        const response = await fetch(`${url}/v1/models`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return { isValid: false, models: [] };
        }
        
        const data = await response.json();
        const modelIds = data?.data?.map((model: any) => model.id) || [];

        return { isValid: true, models: modelIds };
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("LM Studio server validation failed:", error);
        return { isValid: false, models: [] };
    }
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const fileToGenerativePart = async (file: File) => {
    const base64string = await fileToDataUrl(file);
    return {
      inlineData: {
        data: base64string.split(',')[1],
        mimeType: file.type,
      },
    };
};

export const getScoreAndReason = async (apiKey: string, imageFile: File, concept: string, model: GeminiModel, lmStudioUrl: string): Promise<ScoreResponse> => {
    if (model === GeminiModel.LMStudio) {
        const dataUrl = await fileToDataUrl(imageFile);
        const systemPrompt = `You are a LoRA dataset expert. Analyze the attached image for its suitability to train a LoRA for the concept: '${concept}'. Use this rubric:\n${GRADING_RUBRIC}`;
        const userPrompt = `Analyze the attached image and return ONLY a valid JSON object with a 'score' (a float from 0.0 to 1.0) and a 'reason' (a brief justification for the score), based on the concept and rubric provided in the system prompt.`;

        const payload = {
            model: "local-model", // This is often ignored by LM Studio but required by the API spec
            messages: [
                { role: "system", content: systemPrompt },
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: userPrompt },
                        { type: "image_url", image_url: { "url": dataUrl } }
                    ]
                }
            ],
            max_tokens: 512,
        };

        const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`LM Studio request failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        const jsonText = result.choices[0].message.content;
        return JSON.parse(jsonText) as ScoreResponse;

    } else {
        if (!apiKey) throw new Error("A valid API key is required to perform analysis.");
        const ai = new GoogleGenAI({ apiKey });
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `Analyze the attached image and return a JSON object with a 'score' (a float from 0.0 to 1.0) and a 'reason' (a brief justification for the score), based on the concept and rubric.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                systemInstruction: `You are a LoRA dataset expert. Analyze the attached image for its suitability to train a LoRA for the concept: '${concept}'. Use this rubric:\n${GRADING_RUBRIC}`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "A suitability score from 0.0 to 1.0" },
                        reason: { type: Type.STRING, description: "A brief justification for the score" }
                    },
                    required: ["score", "reason"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ScoreResponse;
    }
};

export const getAnnotation = async (apiKey: string, imageFile: File, concept: string, annotationType: AnnotationType, model: GeminiModel, lmStudioUrl: string): Promise<string> => {
     if (model === GeminiModel.LMStudio) {
        const dataUrl = await fileToDataUrl(imageFile);
        const prompt = annotationType === AnnotationType.Caption 
            ? `Describe this image in a single sentence. IMPORTANT: You must NOT use the words or describe the concept of '${concept}'. Focus only on the background, composition, lighting, and other secondary objects.`
            : `List descriptive, comma-separated tags for this image. IMPORTANT: Do NOT repeat tags. You must NOT include tags related to '${concept}'. Focus only on background, composition, lighting, and other secondary objects.`;

        const payload = {
            model: "local-model",
            messages: [{ 
                role: "user", 
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { "url": dataUrl } }
                ]
            }],
            max_tokens: 512,
        };
        const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`LM Studio request failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        let annotation = result.choices[0].message.content;

        if (annotationType === AnnotationType.Tags) {
            const tags = annotation.split(',').map(tag => tag.trim()).filter(tag => tag);
            const uniqueTags = [...new Set(tags)];
            annotation = uniqueTags.join(', ');
        }
        return annotation;
    } else {
        if (!apiKey) throw new Error("A valid API key is required to perform analysis.");
        const ai = new GoogleGenAI({ apiKey });
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = annotationType === AnnotationType.Caption 
          ? `Describe this image in a single sentence. IMPORTANT: You must NOT use the words or describe the concept of '${concept}'. Focus only on the background, composition, lighting, and other secondary objects.`
          : `List descriptive tags for this image. IMPORTANT: You must NOT include tags related to '${concept}'. Focus only on background, composition, lighting, and other secondary objects. Separate tags with a comma.`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text;
    }
};