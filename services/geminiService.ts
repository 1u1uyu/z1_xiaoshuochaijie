import { GoogleGenAI, Type } from "@google/genai";
import { EpisodeOutline } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// Optimization Constants
const CHUNK_SIZE = 100000; // Larger chunks for fewer requests
const MAX_CHUNKS = 20;
const CONCURRENCY_LIMIT = 3; // Process 3 chunks in parallel for speed

/**
 * Splits text into manageable chunks
 */
const splitTextIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks.slice(0, MAX_CHUNKS);
};

/**
 * Summarizes a single chunk of text
 */
const summarizeChunk = async (text: string, index: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        请快速阅读以下小说片段（第 ${index + 1} 部分），提取关键剧情点。
        
        要求：
        1. 忽略无关的环境描写，只保留核心事件、冲突和关键对话。
        2. 标注出本片段内发生的主要事件的时间线。
        
        片段内容：
        ${text.slice(0, 40000)}... (内容较长，已截取前40000字重点分析)
      `,
      config: {
        systemInstruction: "你是一个高效的小说剧情分析师。",
      }
    });
    return `[第 ${index + 1} 部分摘要]: ${response.text || ""}`;
  } catch (e) {
    console.error(`Error summarizing chunk ${index}`, e);
    return `[第 ${index + 1} 部分分析跳过]`;
  }
};

/**
 * Helper to process promises in batches
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, batchIndex) => 
      fn(item, i + batchIndex).then(res => {
        if (onProgress) onProgress(i + batchIndex + 1, items.length);
        return res;
      })
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  return results;
}

/**
 * Generates the outline from the novel text based on episode count.
 * Optimized with concurrent batch processing.
 */
export const generateOutline = async (
  novelText: string, 
  episodeCount: number,
  onProgress?: (status: string) => void
): Promise<EpisodeOutline[]> => {
  try {
    let contextForOutline = "";

    // If text is very long, summarize it chunk by chunk
    if (novelText.length > CHUNK_SIZE) {
      const chunks = splitTextIntoChunks(novelText);
      
      if (onProgress) onProgress(`正在并行分析小说内容 (共 ${chunks.length} 部分)...`);

      // Use batched processing for speed
      const summaries = await processInBatches(
        chunks,
        CONCURRENCY_LIMIT,
        summarizeChunk,
        (completed, total) => {
          if (onProgress) onProgress(`正在分析小说剧情... (${completed}/${total})`);
        }
      );
      
      contextForOutline = summaries.join("\n\n");
    } else {
      if (onProgress) onProgress("正在分析小说全篇内容...");
      contextForOutline = novelText;
    }

    if (onProgress) onProgress("正在构建剧集结构，生成分集大纲...");

    const prompt = `
      你是一位资深的网络短剧（Micro-drama）编剧主笔。请根据提供的小说剧情内容，将其改编为一部**${episodeCount}集**的短剧大纲。

      **重要前提：**
      1. **均匀分配**：将提供的剧情均匀分配到 ${episodeCount} 集中，确保每一集都有实质内容。
      2. **节奏要求**：短剧节奏极快，每集结尾必须有“钩子”（Hook）或反转。
      3. **未完结处理**：如果小说未完结，第 ${episodeCount} 集作为阶段性结局。

      **任务：**
      输出${episodeCount}集的JSON数组。
      格式：[{ "episodeNumber": 1, "title": "...", "synopsis": "..." }]

      **小说剧情摘要：**
      ${contextForOutline}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              episodeNumber: { type: Type.INTEGER },
              title: { type: Type.STRING },
              synopsis: { type: Type.STRING },
            },
            required: ["episodeNumber", "title", "synopsis"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as EpisodeOutline[];
    }
    throw new Error("No output generated for outline.");
  } catch (error) {
    console.error("Error generating outline:", error);
    throw error;
  }
};

/**
 * Generates a detailed script for a specific episode.
 * Optimized with MASSIVE context window for accuracy.
 */
export const generateEpisodeScript = async (
  novelText: string,
  episode: EpisodeOutline,
  totalEpisodes: number,
  prevEpisodeSummary?: string
): Promise<string> => {
  try {
    // Optimization: Drastically increase context window.
    // Gemini 2.5 Flash handles huge context well.
    // Instead of a small slice, we send a very large chunk (e.g., 150k chars or 20% of book)
    // to ensure the specific scene is definitely included.
    
    const totalLength = novelText.length;
    
    // Estimate center position
    const approximateCenter = (episode.episodeNumber / totalEpisodes) * totalLength;
    
    // Huge window: 150,000 characters (approx 30k-40k tokens), well within limits.
    // This allows the model to "Search" for the scene accurately.
    const windowSize = Math.max(150000, totalLength / 5); 
    
    let start = Math.floor(approximateCenter - windowSize / 2);
    let end = Math.floor(approximateCenter + windowSize / 2);
    
    if (start < 0) {
      start = 0;
      end = Math.min(totalLength, windowSize);
    }
    if (end > totalLength) {
      end = totalLength;
      start = Math.max(0, totalLength - windowSize);
    }

    const contextText = novelText.slice(start, end);

    const prompt = `
      你是一位专业的短剧分镜编剧。请为**第 ${episode.episodeNumber} 集：${episode.title}** 撰写详细的拍摄剧本。

      **核心任务：**
      在提供的长篇小说片段中，精准定位与本集梗概（${episode.synopsis}）对应的具体情节，并将其改编为剧本。
      *注意：提供的片段很长，请自行检索相关情节。如果片段中未包含该情节（极少情况），请根据梗概进行创作。*

      **剧本要求：**
      1. **格式**：Markdown格式，包含【场次】、【分镜/景别】、【人物动作】、【对话】。
      2. **风格**：节奏紧凑，情绪饱满，冲突前置。
      3. **篇幅**：500-800字（时长2-3分钟）。

      **本集梗概：**
      ${episode.synopsis}

      ${prevEpisodeSummary ? `**前情提要：** ${prevEpisodeSummary}` : ''}

      **小说原文参考片段：**
      ...${contextText}...
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "text/plain", 
        // Use a slightly higher temperature for creativity in dialogue, but kept balanced
        temperature: 0.7, 
        systemInstruction: "你是一个短剧分镜师。你的剧本画面感极强。请直接输出剧本内容，不要输出'好的'等废话。",
      },
    });

    return response.text || "生成剧本失败，请重试。";
  } catch (error) {
    console.error("Error generating script:", error);
    return "错误：无法生成剧本，请稍后重试。";
  }
};