import { GoogleGenAI, Modality } from '@google/genai';
import { GroundingChunk } from '../types';

// FIX: Initialize the GoogleGenAI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a Japanese lesson for a given word using Gemini.
 * It also provides image prompts and web sources for grounding.
 */
export const generateLesson = async (
  word: string,
  mode: 'detailed' | 'summary' = 'detailed'
): Promise<{ lesson: string; prompts: string[]; sources: GroundingChunk[] }> => {
    const model = 'gemini-2.5-flash';
    
    // Prompt detallado (tu original)
    const detailedPrompt = `
    Tu rol es "Nihongo Sensei AI". Tu misión es crear una lección educativa y visualmente estructurada sobre la palabra japonesa: "${word}".

    REGLAS CRÍTICAS:
    1.  **SIN SALUDOS:** NO incluyas NINGÚN saludo o introducción. Ve directamente al grano, empezando la lección con la sección "### Palabra a estudiar:".
    2.  **IDIOMA:** La lección debe ser COMPLETAMENTE EN ESPAÑOL.
    3.  **FORMATO DE EJEMPLOS ESTRICTO:** En la sección de ejemplos, CADA ejemplo DEBE consistir en TRES items de lista de Markdown consecutivos y separados (Japonés, Romaji, Traducción). DEBE haber una línea en blanco entre cada grupo de tres. NO uses etiquetas.

    ### Estructura de la Lección (Usa Markdown Enriquecido):
    Usa el siguiente formato EXACTO para la lección, con títulos, separadores, negritas y citas.

    ---

    ### Palabra a estudiar:
    **[PALABRA_JAPONESA]** (escribe la palabra en romaji, hiragana/kanji si aplica, y traducción).

    ---

    ### Significado y Contextos de Uso:
    Explica el significado principal. Describe 2-3 contextos de uso. Usa **negritas** para resaltar la palabra.
    > **¡Dato Curioso!** Incluye una anécdota cultural/histórica interesante.

    ---

    ### Ejemplos Simples para Practicar:
    Proporciona 3 frases de ejemplo con el formato estricto de tres líneas de lista separadas y una línea en blanco entre cada ejemplo.
    *   [Frase 1 en Japonés]
    *   [Frase 1 en Romaji]
    *   [Frase 1 en Español]

    *   [Frase 2 en Japonés]
    *   [Frase 2 en Romaji]
    *   [Frase 2 en Español]

    *   [Frase 3 en Japonés]
    *   [Frase 3 en Romaji]
    *   [Frase 3 en Español]

    ---

    ### Desglose de Kanjis:
    Si la palabra tiene kanjis, explícalos uno por uno. Para cada kanji:
    *   **Kanji 1: [carácter]** ([lectura])
    *   **Significado:** [significado del kanji]
    *   **Otras palabras con [carácter]:** [2-3 ejemplos de otras palabras con el mismo kanji, con su lectura y significado breve]

    ---

    ### Mini Quiz Interactivo:
    Genera 3 preguntas de opción múltiple basadas en los ejemplos y kanjis anteriores.

    **FORMATO ESTRICTO OBLIGATORIO:**

    Pregunta 1: ¿Qué significa "**[palabra o kanji]**"?
    🅰️ [Respuesta incorrecta corta]
    🅱️ [Respuesta incorrecta corta]
    🅲️ [Respuesta incorrecta corta]
    🅳️ [Respuesta correcta]

    Pregunta 2: [Otra pregunta sobre kanji, uso o completar frase]
    🅰️ [Respuesta incorrecta corta]
    🅱️ [Respuesta correcta]
    🅲️ [Respuesta incorrecta corta]
    🅳️ [Respuesta incorrecta corta]

    Pregunta 3: [Tercera pregunta variada]
    🅰️ [Respuesta correcta]
    🅱️ [Respuesta incorrecta corta]
    🅲️ [Respuesta incorrecta corta]
    🅳️ [Respuesta incorrecta corta]

    **REGLAS CRÍTICAS PARA LAS OPCIONES:**
    - Cada opción: MÁXIMO 4 palabras, solo la respuesta directa
    - NUNCA uses dos puntos (:) dentro de las opciones
    - NUNCA agregues explicaciones en las opciones
    - NO uses frases como "Otras palabras con..."
    - SIEMPRE exactamente 4 opciones (A, B, C, D)
    - La correcta debe estar en posiciones variadas (no siempre en la misma letra)

    ---
    
    ### Formato de Salida Obligatorio para Prompts:
    **MUY IMPORTANTE**: Después de TODA la lección, añade la sección de prompts. DEBE empezar con la línea exacta '--- PROMPTS ---'. Después de esa línea, lista los 3 prompts, cada uno en una línea nueva, comenzando con 'PROMPT:'.
    Los prompts deben ser en INGLÉS. CADA prompt debe instruir que se muestre visiblemente la palabra en Kanji, su Hiragana y su traducción al español.

    **Tipos de Prompts:**
    1.  **Contexto Real:** Basado en la PRIMERA frase de ejemplo, mostrando la acción.
    2.  **Desglose de Kanjis:** Una infografía o mapa mental educativo. Las etiquetas deben estar en español (ej. "Componentes").
    3.  **Contexto Real 2:** Basado en la SEGUNDA frase de ejemplo, mostrando una situación diferente.
    `;

    // Prompt resumido (versión corta)
    const summaryPrompt = `
    Tu rol es "Nihongo Sensei AI". Crea una lección RESUMIDA Y CONCISA sobre la palabra japonesa: "${word}".

    REGLAS CRÍTICAS:
    1.  **SIN SALUDOS:** Ve directo al punto, empezando con "### Palabra a estudiar:".
    2.  **IDIOMA:** Completamente en ESPAÑOL.
    3.  **SER BREVE:** Máximo 2-3 párrafos totales más ejemplos.

    ### Estructura Resumida:

    ---

    ### Palabra a estudiar:
    **[PALABRA_JAPONESA]** (romaji, hiragana/kanji, traducción)

    ---

    ### Significado:
    1 párrafo corto explicando el significado principal y uso común.

    ---

    ### Ejemplos Rápidos:
    2 ejemplos cortos con el formato de tres líneas:

    *   [Frase 1 en Japonés]
    *   [Frase 1 en Romaji]
    *   [Frase 1 en Español]

    *   [Frase 2 en Japonés]
    *   [Frase 2 en Romaji]
    *   [Frase 2 en Español]

    ---

    ### Desglose de Kanjis:
    Explica brevemente cada kanji que conforma la palabra, indicando su carácter, lectura y significado principal (máximo 1 frase por kanji). NO incluyas lista de otras palabras con ese kanji.

    ---

    ### Mini Quiz Interactivo:
    Genera 2 preguntas de opción múltiple basadas en los ejemplos anteriores.

    **FORMATO ESTRICTO OBLIGATORIO:**

    Pregunta 1: ¿Qué significa "**[palabra o kanji]**"?
    🅰️ [Respuesta incorrecta corta]
    🅱️ [Respuesta correcta]
    🅲️ [Respuesta incorrecta corta]
    🅳️ [Respuesta incorrecta corta]

    Pregunta 2: [Otra pregunta sobre uso o kanji]
    🅰️ [Respuesta incorrecta corta]
    🅱️ [Respuesta incorrecta corta]
    🅲️ [Respuesta correcta]
    🅳️ [Respuesta incorrecta corta]

    **REGLAS CRÍTICAS PARA LAS OPCIONES:**
    - Cada opción: MÁXIMO 4 palabras, solo la respuesta directa
    - NUNCA uses dos puntos (:) dentro de las opciones
    - NUNCA agregues explicaciones
    - SIEMPRE exactamente 4 opciones (A, B, C, D)

    ---

    ### Formato de Salida Obligatorio para Prompts:
    Después de la lección, añade '--- PROMPTS ---' y lista 2 prompts en INGLÉS, cada uno en una línea nueva, comenzando con 'PROMPT:'.
    `;

    // Selecciona el prompt según el modo
    const prompt = mode === 'detailed' ? detailedPrompt : summaryPrompt;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const textResponse = response.text;
    
    const separator = '--- PROMPTS ---';
    const parts = textResponse.split(separator);

    if (parts.length < 2) {
        throw new Error('No se pudo encontrar el separador de prompts en la respuesta de la IA. Respuesta: ' + textResponse);
    }

    const lesson = parts[0].trim();
    const promptsText = parts[1].trim();
    const prompts = promptsText.split('\n')
        .map(line => line.replace(/^PROMPT:\s*/, '').trim())
        .filter(line => line.length > 0);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { lesson, prompts, sources };
};


/**
 * Generates an image using Imagen 4 based on a text prompt.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const model = 'imagen-4.0-generate-001';
    
    const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    
    throw new Error('Image generation failed.');
};

/**
 * Edits an image based on a base64 string, mime type, and a text prompt.
 */
export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error('Image editing failed.');
};

/**
 * Connects to the Live API for real-time voice conversation.
 */
export const connectLive = (callbacks: any) => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a friendly and helpful Japanese language tutor. Keep your responses concise and conversational.',
        },
    });
};
