import { GoogleGenAI } from "@google/genai";
import { DesignStyle, RoomType } from "../types";

// Initialize the client
// Note: In a real production app dealing with "Veo" or "Pro" level image gen, 
// we might need the window.aistudio key selection flow. 
// For this demo using Flash-Image, strict env key is sufficient and more robust for immediate testing.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Helper to convert a base64 string to the format expected by Gemini
 * Strips the data:image/png;base64, prefix
 */
const cleanBase64 = (base64Data: string): string => {
  return base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64Data: string): string => {
  const match = base64Data.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Internal helper to call Gemini API for a single image generation
 */
const generateImageWithGemini = async (prompt: string, cleanData: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanData,
            },
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated in response.");
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};

/**
 * Removes furniture from the room using Gemini's editing capabilities.
 * Returns an array with a single result (consistent type signature).
 * 
 * @param base64Image - The input image. If isManualMask is true, this image has red paint on it.
 * @param keepDescription - Optional text description of items to keep (used in auto mode).
 * @param isManualMask - If true, treats the image as having a visual mask (red strokes).
 */
export const removeFurniture = async (base64Image: string, keepDescription?: string, isManualMask: boolean = false): Promise<string[]> => {
  const cleanData = cleanBase64(base64Image);
  const mimeType = getMimeType(base64Image);

  let prompt = "";

  if (isManualMask) {
    // Prompt for Visual Prompting / Magic Eraser
    prompt = "Edit this image. The areas marked with transparent red are items to be removed. Remove the red masked objects completely. Inpaint the background where the red marks are to match the surrounding floor, walls, and lighting perfectly. Leave the rest of the image (areas without red marks) exactly as is. The result should be a clean, realistic photo.";
  } else {
    // Prompt for Auto Detection
    prompt = "Edit this image. Identify all furniture, rugs, decorations, and items in this room. Remove them completely to show an empty room. Inpaint the floor and walls where the furniture was, maintaining the original architectural structure, lighting, and window positions exactly. The result should be a clean, empty real estate photo of the same room.";

    if (keepDescription && keepDescription.trim().length > 0) {
      prompt = `Edit this image. Remove most furniture, rugs, and decorations to clear the room, BUT explicitly KEEP and PRESERVE the following items: ${keepDescription}. Remove everything else. Inpaint the floor and walls where the removed items were, maintaining the original architectural structure, lighting, and window positions.`;
    }
  }

  const result = await generateImageWithGemini(prompt, cleanData, mimeType);
  return [result];
};

/**
 * Adds furniture to the room while preserving original style.
 * Generates 3 variations.
 */
export const addFurniture = async (base64Image: string, roomType: RoomType, furnitureList: string[], userPrompt?: string): Promise<string[]> => {
  const cleanData = cleanBase64(base64Image);
  const mimeType = getMimeType(base64Image);

  const itemsStr = furnitureList.join(", ");
  
  // We will generate 3 variations by slightly tweaking the prompts
  const variations = ['Option A', 'Option B', 'Option C'];
  
  const promises = variations.map(variation => {
    const prompt = `Edit this image. The room is a ${roomType}.
    
    Task: Add the following furniture items to the room in a realistic layout: ${itemsStr}.
    ${userPrompt ? `Additional instructions from user: ${userPrompt}` : ''}
    
    Design Variation: ${variation}.
    
    CRITICAL CONSTRAINTS:
    1. DO NOT change the existing interior design style, wall colors, flooring material, or architectural details.
    2. The new furniture MUST match the exact style and lighting of the original room.
    3. Blend the new items naturally into the scene with correct perspective and shadows.
    4. Keep existing structural elements (windows, doors, fireplace) unchanged.`;

    return generateImageWithGemini(prompt, cleanData, mimeType);
  });

  return Promise.all(promises);
};

/**
 * Transforms the room style using Gemini.
 * Generates 3 variations.
 */
export const transformRoomStyle = async (base64Image: string, style: DesignStyle, roomType: RoomType): Promise<string[]> => {
  const cleanData = cleanBase64(base64Image);
  const mimeType = getMimeType(base64Image);

  const variations = ['Variation 1', 'Variation 2', 'Variation 3'];

  const promises = variations.map(variation => {
    const prompt = `Edit this image. Redesign this room as a ${roomType} in a ${style} interior design style. 
    Variation approach: ${variation}.
    Keep the room's structural layout, ceiling height, and window positions exactly the same. Change the furniture, textures, lighting, and colors to match the ${style} aesthetic. High quality, photorealistic, 4k resolution.`;

    return generateImageWithGemini(prompt, cleanData, mimeType);
  });

  return Promise.all(promises);
};