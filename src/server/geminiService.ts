/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { sanitizeFileName, normalizeCategory } from '../utils/fileOrganizerUtils.js';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface AnalyzeFileInput {
  fileName: string;
  mimeType: string;
  textSnippet?: string;
  base64Data?: string;
  size?: number;
}

export interface AnalyzeFileOutput {
  summary: string;
  suggestedName: string;
  suggestedCategory: string;
}

export async function analyzeFileWithGemini(input: AnalyzeFileInput): Promise<AnalyzeFileOutput> {
  const { fileName, mimeType, textSnippet, base64Data, size } = input;

  // Check file size threshold (e.g. > 15MB)
  if (size && size > 15 * 1024 * 1024) {
    return {
      summary: 'Archivo demasiado pesado para análisis directo (> 15 MB).',
      suggestedName: sanitizeFileName(fileName, fileName),
      suggestedCategory: 'Archivos Grandes',
    };
  }

  const ai = getAIClient();

  const promptText = `Analiza este archivo de Google Drive:
- Nombre original: "${fileName}"
- Tipo MIME: "${mimeType}"
${textSnippet ? `- Contenido/extracto del archivo:\n"""\n${textSnippet.slice(0, 5000)}\n"""` : '- Contenido: visual o binario adjunto.'}

Instrucciones:
1. Resumen: En exactamente UNA línea corta y amable (máximo 15 palabras en español) explica de qué trata el archivo.
2. Nombre sugerido: Genera un nombre claro, ordenado, profesional y descriptivo en español (por ejemplo: "Factura_Luz_Enero_2024.pdf" o "Contrato_Alquiler_Vivienda.pdf"). Mantén la extensión original intacta. Si el archivo no tiene extensión (como un Google Doc), sugiere un nombre descriptivo limpio.
3. Categoría sugerida: Clasifícalo en una categoría lógica en español (por ejemplo: "Facturas y Recibos", "Documentos Legales", "Trabajo y Proyectos", "Estudio y Cursos", "Fotos Personales", "Finanzas e Impuestos", "Salud y Medicina", "Personal y Varios").`;

  try {
    const contents: any[] = [];

    // If an image or PDF inline data is provided
    if (base64Data && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
      contents.push({
        parts: [
          {
            inlineData: {
              mimeType: mimeType.startsWith('image/') ? mimeType : 'application/pdf',
              data: base64Data,
            },
          },
          { text: promptText },
        ],
      });
    } else {
      contents.push({
        parts: [{ text: promptText }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents[0].parts ? contents[0] : promptText,
      config: {
        systemInstruction: `Eres un asistente experto en organizar archivos en español para usuarios no técnicos.
Devuelve siempre un objeto JSON válido con los tres campos exactos: summary, suggestedName, suggestedCategory.
Mantén la extensión de archivo correcta y sugiere categorías claras y ordenadas.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Resumen en una sola línea del archivo en español.',
            },
            suggestedName: {
              type: Type.STRING,
              description: 'Nombre claro y descriptivo con la extensión original.',
            },
            suggestedCategory: {
              type: Type.STRING,
              description: 'Categoría sugerida para la subcarpeta en español.',
            },
          },
          required: ['summary', 'suggestedName', 'suggestedCategory'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    return {
      summary: (parsed.summary || 'Documento analizado').trim(),
      suggestedName: sanitizeFileName(parsed.suggestedName || fileName, fileName),
      suggestedCategory: normalizeCategory(parsed.suggestedCategory || 'General'),
    };
  } catch (error: any) {
    console.error('Error in analyzeFileWithGemini:', error?.message || error);
    // Graceful fallback if Gemini quota is reached or network glitch
    return {
      summary: 'No se pudo analizar el contenido completo.',
      suggestedName: sanitizeFileName(fileName, fileName),
      suggestedCategory: 'Archivos Varios',
    };
  }
}
