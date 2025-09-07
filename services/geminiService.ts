
// FIX: Removed unused `Modality` import after updating image generation logic.
import { GoogleGenAI, Type, Chat, Part, Modality } from "@google/genai";
import { drawImageWithPointer } from './imageUtils';

if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set. Please ensure it is configured for the application to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Re-exporting types for use in other components
export type { Chat, Part };

/**
 * Converts a File object into a GoogleGenAI.Part object for use with multimodal prompts.
 * @param file The File object to convert.
 * @returns A Promise that resolves with a Part object containing the file's base64 data and MIME type.
 */
function fileToGenerativePart(file: File): Promise<Part> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (base64Data) {
                resolve({
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                });
            } else {
                reject(new Error("Failed to read file data."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

const IMAGE_ANALYSIS_SYSTEM_INSTRUCTION = `You are a specialized AI assistant for radiology. Your task is to analyze an uploaded radiographic X-ray image and generate a concise, factual, and clinical description suitable for educational purposes.

**Instructions:**
1.  **Identify Anatomy:** Clearly state the anatomical region shown (e.g., left hand and wrist, chest, knee).
2.  **Identify View:** Specify the radiographic projection (e.g., AP, PA, lateral, oblique).
3.  **Describe Findings:** Detail any visible pathology or abnormalities (e.g., "displaced fracture of the distal radius," "pulmonary nodules," "signs of osteoarthritis"). Be precise.
4.  **Format:** Your output MUST be a single, continuous string of text. Do not use lists, markdown, or any formatting. It should read like a professional clinical note or a prompt for generating a similar image.
5.  **Scope:** Stick to objective visual findings. Do not provide a diagnosis, differential diagnoses, or treatment recommendations.

**Example Output:**
"AP view of a left hand and wrist in an adult, showing a clear, displaced Colles' fracture of the distal radius with dorsal angulation and mild soft-tissue swelling."`;

const PROMPT_GENERATION_SYSTEM_INSTRUCTION = `You are MedX Tutor, a medical education assistant.
Your job is to read a short natural-language request from a student (in Hindi or English) and convert it into a precise, clinical image-generation prompt for a realistic, synthetic radiographic X-ray. You will be provided with the user's request along with the patient's age and gender. Incorporate these demographic details into the prompt you generate to ensure clinical accuracy (e.g., 'adult (35-year-old male)').

Image requirements for the prompt you generate:
- Modality: radiographic X-ray aesthetic, grayscale, high contrast.
- View: specify appropriate projection (e.g., AP/PA/oblique/lateral) and anatomy.
- Content: Realistic anatomy and pathology only; no gore, no text overlays, no labels, no watermarks, no extraneous artifacts.
- Framing: Should include the relevant joint(s) and adjacent bones for context.
- Clarity: The abnormality should be clearly visible for educational purposes.

Safety & scope:
- All images are synthetic and for education only, not clinical use.
- Do not provide medical advice or diagnosis.
- If the user asks for identifiable real patient data, refuse and offer a synthetic alternative.

Output format:
- If the input is ambiguous, choose the most common clinically useful view.
- Your entire output MUST BE ONLY the final, detailed image generation prompt. Do not include any other text, explanation, or markdown formatting.`;

const EXPLANATION_SYSTEM_INSTRUCTION = `You are MedX Tutor, an AI assistant for medical students and beginners.
Your primary goal is to make complex medical concepts easy to understand. When given a description of a synthetic X-ray, provide a clear, beginner-friendly, and structured educational explanation.

**Your Response Structure:**

1.  **Introduction:** Start by clearly stating what the synthetic X-ray shows in simple, plain language.
2.  **Structured Explanation (use these exact markdown headers):**
    - **### Findings:** Describe what is visible on the X-ray. Avoid overly technical jargon. If you must use a medical term (like 'distal phalanx'), immediately follow it with a simple explanation in parentheses (e.g., 'the bone at the tip of the finger').
    - **### Cause/Context:** Explain the common causes of this condition and the symptoms a person might experience. Use analogies if they help clarify (e.g., 'imagine the bone cracked like a twig').
    - **### Treatment/Education:** Briefly outline the typical management approach for this condition. Emphasize that this is for educational purposes only and not medical advice.
3.  **Important Note:** Always conclude with a clear disclaimer that the image is synthetic and for educational use only, not for actual medical diagnosis.

**Tone and Language:**
- **Beginner-Friendly:** Write as if you're explaining it to someone new to medicine.
- **Clear & Concise:** Keep sentences short and to the point.
- **Empathetic and Educational:** Your tone should be helpful and supportive.

**Constraints:**
- The entire explanation should be around 150-200 words.
- Do not provide personalized medical advice.
- You MUST use the markdown headers \`### Findings\`, \`### Cause/Context\`, and \`### Treatment/Education\`.
`;

const QUIZ_GENERATION_SYSTEM_INSTRUCTION = `You are a medical education quiz creator.
Your task is to generate a list of 10 multiple-choice questions based on the provided clinical prompt for a synthetic X-ray. Each question should test a key learning point from the scenario.

**Output Requirements:**
- You MUST respond with a single, valid JSON array of quiz objects.
- Do not include any other text, explanations, or markdown formatting like \`\`\`json.
- Each object in the array must strictly adhere to the following schema:
  {
    "question": "string",
    "options": ["string", "string", "string", "string"], // Exactly 4 options
    "correctAnswerIndex": "number (0-3)",
    "explanation": "string (A brief explanation for why the correct answer is right)"
  }`;

const CHAT_SYSTEM_INSTRUCTION = `You are MedX Tutor, a friendly and knowledgeable AI assistant for medical students. Your role is to answer follow-up questions about a specific synthetic X-ray image and its medical explanation.

A context containing the clinical prompt used to generate the image and the detailed explanation of the findings will be provided to you at the beginning of our conversation. If the user provides an image with a pointer, your primary focus should be to identify and discuss the anatomy or pathology indicated by the pointer.

**Your Guidelines:**
1.  **Stay on Topic:** All your answers must relate directly to the provided X-ray context. If the user asks something unrelated, gently guide them back to the topic.
2.  **Be an Educator:** Explain concepts clearly and simply. Use analogies if helpful. Your goal is to help the student learn.
3.  **Safety First:**
    - **NEVER** provide medical advice, diagnosis, or treatment plans for real individuals.
    - Always remind the user that the information is for educational purposes only and is based on a synthetic image.
    - Do not invent information beyond what can be inferred from the provided context.
4.  **Tone:** Be encouraging, patient, and professional.
`;

const EXPLORATION_SYSTEM_INSTRUCTION = `You are a visual medical education assistant. A user has provided an X-ray image with a red pointer indicating a specific region of interest.

Your task is twofold and you MUST return both a text part and an image part:
1.  **Textual Explanation:** In 2-3 sentences, identify the anatomical structure or pathology indicated by the pointer. Explain it in simple, clear terms suitable for a medical student. Do not give medical advice.
2.  **Visual Diagram:** Generate a new, clean, educational diagram based on the original image. This diagram should be a close-up or annotated version of the pointed-at area. Use clear, simple labels, arrows, or outlines to highlight the key feature. The diagram should maintain the radiographic aesthetic but emphasize clarity.

**Example Output:**
-   **Text Part:** "The pointer indicates a Colles' fracture, which is a break in the distal radius (the larger of the two forearm bones). Note the characteristic dorsal displacement, where the broken fragment of bone is angled upwards."
-   **Image Part:** (A new image is generated showing a zoomed-in view of the wrist, with an arrow pointing to the fracture line and a simple label that says "Distal Radius Fracture".)`;

export async function generateClinicalPrompt(userInput: string, age: number, gender: string): Promise<string> {
    try {
        const fullRequest = `User Request: "${userInput}"\nPatient Age: ${age}\nPatient Gender: ${gender}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullRequest,
            config: {
                systemInstruction: PROMPT_GENERATION_SYSTEM_INSTRUCTION,
                temperature: 0.2, 
            }
        });
        
        const cleanedText = response.text.replace(/```(plaintext|json)?/g, '').trim();
        return cleanedText;

    } catch (error) {
        console.error("Error generating clinical prompt:", error);
        throw new Error("Failed to communicate with the text generation AI.");
    }
}

export async function generateXRayExplanation(clinicalPrompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following synthetic X-ray description, provide an educational explanation: "${clinicalPrompt}"`,
            config: {
                systemInstruction: EXPLANATION_SYSTEM_INSTRUCTION,
                temperature: 0.3,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating X-ray explanation:", error);
        throw new Error("Failed to communicate with the text generation AI for explanation.");
    }
}

// FIX: Aligned image generation with Gemini API guidelines.
// Using `generateImages` with the `imagen-4.0-generate-001` model is the recommended approach for generating images from a text prompt.
export async function generateXRayImage(clinicalPrompt: string): Promise<string> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: clinicalPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              // Using a square aspect ratio which is common for X-rays.
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            const refusalReason = 'Image generation model did not return an image.';
            throw new Error(refusalReason);
        }
    } catch (error) {
        console.error("Error generating X-Ray image:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to communicate with the image generation AI: ${error.message}`);
        }
        throw new Error("Failed to communicate with the image generation AI due to an unknown error.");
    }
}

export async function analyzeUploadedXRay(file: File): Promise<string> {
    try {
        const imagePart = await fileToGenerativePart(file);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart] },
            config: {
                systemInstruction: IMAGE_ANALYSIS_SYSTEM_INSTRUCTION,
                temperature: 0.2,
            }
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error analyzing uploaded X-ray:", error);
        throw new Error("Failed to analyze the uploaded image with AI.");
    }
}

export interface QuizData {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

export async function generateQuiz(clinicalPrompt: string): Promise<QuizData[]> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a quiz question for this scenario: "${clinicalPrompt}"`,
            config: {
                systemInstruction: QUIZ_GENERATION_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                            },
                            correctAnswerIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING },
                        },
                        required: ["question", "options", "correctAnswerIndex", "explanation"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const quizzes = JSON.parse(jsonText);
        
        if (!Array.isArray(quizzes)) {
             throw new Error("Received malformed quiz data from AI, expected an array.");
        }
        
        return quizzes;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate the interactive quiz.");
    }
}

export function createChatSession(context: string): Chat {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: [
            {
                role: 'user',
                parts: [{ text: `Here is the context for the X-ray we will be discussing:\n\n${context}` }],
            },
            {
                role: 'model',
                parts: [{ text: 'Great! I have reviewed the context. I am ready to answer your questions about this specific X-ray.' }],
            }
        ],
        config: {
            systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            temperature: 0.5,
        }
    });
    return chat;
}

export async function generatePointerExplanationAndDiagram(baseImageUrl: string, pointerCoords: { x: number; y: number }): Promise<{ explanation: string; diagramImageUrl: string; }> {
    try {
        const imageWithPointer = await drawImageWithPointer(baseImageUrl, pointerCoords);
        const base64Data = imageWithPointer.split(',')[1];

        const imagePart: Part = {
            inlineData: {
                mimeType: 'image/png',
                data: base64Data,
            },
        };

        const textPart: Part = {
            text: 'Analyze the area marked by the pointer and generate a diagram and explanation.',
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: EXPLORATION_SYSTEM_INSTRUCTION,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let explanation = '';
        let diagramImageUrl = '';

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    explanation = part.text;
                } else if (part.inlineData?.data) {
                    diagramImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        if (!explanation || !diagramImageUrl) {
            throw new Error("The AI failed to return both an explanation and a diagram. Please try again.");
        }

        return { explanation, diagramImageUrl };

    } catch (error) {
        console.error("Error generating pointer explanation and diagram:", error);
        if (error instanceof Error) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during the AI analysis.");
    }
}
