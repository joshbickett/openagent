/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from './contentGenerator.js';
import type {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  Content,
  Part,
  Candidate,
  ContentUnion,
} from '@google/genai';
import { FinishReason } from '@google/genai';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';


/**
 * Maps Gemini model names to OpenRouter format
 * This was mentioned in the PR but missing from implementation
 */
function mapGeminiModelToOpenRouter(model: string): string {
  const modelMap: Record<string, string> = {
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'gemini-2.5-pro-preview': 'google/gemini-2.5-pro-preview',
    'gemini-2.5-flash-preview': 'google/gemini-2.5-flash-preview',
    'gemini-2.0-flash-thinking-exp': 'google/gemini-2.0-flash-thinking-exp',
    'gemini-2.0-flash-exp': 'google/gemini-2.0-flash-exp',
    'gemini-pro': 'google/gemini-pro',
    'gemini-pro-vision': 'google/gemini-pro-vision',
    'gemini-1.5-pro': 'google/gemini-pro-1.5',
    'gemini-1.5-flash': 'google/gemini-flash-1.5',
  };
  
  // If already in OpenRouter format, return as-is
  if (model.includes('/')) {
    return model;
  }
  
  // Otherwise map from Gemini format
  return modelMap[model] || model;
}

/**
 * Get appropriate max tokens for model
 * Improvement over hardcoded 20000
 */
function getMaxTokensForModel(model: string): number {
  // Conservative defaults for different model types
  if (model.includes('gemini-2.5')) return 8192;
  if (model.includes('gemini-pro')) return 8192;
  if (model.includes('claude')) return 4096;
  if (model.includes('gpt-4')) return 4096;
  return 4096; // Safe default
}

export function createOpenRouterContentGenerator(
  config: ContentGeneratorConfig,
  httpOptions: { headers: Record<string, string> },
): ContentGenerator {
  const openRouterClient = new OpenAI({
    baseURL: process.env['OPENROUTER_BASE_URL'] || 'https://openrouter.ai/api/v1',
    apiKey: config.apiKey || process.env['OPENROUTER_API_KEY'],
    defaultHeaders: {
      ...httpOptions.headers,
      'HTTP-Referer': 'https://github.com/joshuavial/openagent',
      'X-Title': 'OpenAgent CLI',
    },
  });

  async function* doGenerateContentStream(
    request: GenerateContentParameters,
  ): AsyncGenerator<GenerateContentResponse> {
    try {
      const messages = convertToOpenAIFormat(request);
      const systemInstruction = extractSystemInstruction(request);
      const modelName = mapGeminiModelToOpenRouter(request.model || DEFAULT_GEMINI_MODEL);
      const maxTokens = request.config?.maxOutputTokens || getMaxTokensForModel(modelName);

      const stream = await openRouterClient.chat.completions.create({
        model: modelName,
        messages: systemInstruction
          ? [{ role: 'system', content: systemInstruction }, ...messages]
          : messages,
        temperature: request.config?.temperature,
        top_p: request.config?.topP,
        max_tokens: maxTokens,
        tools: convertTools(request.config?.tools),
        stream: true,
        stream_options: { include_usage: true },
      });

      let hasContent = false;
      for await (const chunk of stream) {
        const response = convertChunkToGeminiResponse(chunk);
        if (response.candidates && response.candidates.length > 0) {
          hasContent = true;
          yield response;
        }
      }
      
      // If we never got any content, yield an empty response with finish reason
      if (!hasContent) {
        yield {
          candidates: [{
            content: {
              role: 'model',
              parts: [{ text: '' }],
            },
            index: 0,
            finishReason: FinishReason.STOP,
          }],
        } as unknown as GenerateContentResponse;
      }
    } catch (error) {
      throw convertError(error);
    }
  }

  const openRouterContentGenerator: ContentGenerator = {
    async generateContent(
      request: GenerateContentParameters,
      userPromptId: string,
    ): Promise<GenerateContentResponse> {
      try {
        const messages = convertToOpenAIFormat(request);
        const systemInstruction = extractSystemInstruction(request);
        const modelName = mapGeminiModelToOpenRouter(request.model || DEFAULT_GEMINI_MODEL);
        const maxTokens = request.config?.maxOutputTokens || getMaxTokensForModel(modelName);

        const completion = await openRouterClient.chat.completions.create({
          model: modelName,
          messages: systemInstruction
            ? [{ role: 'system', content: systemInstruction }, ...messages]
            : messages,
          temperature: request.config?.temperature,
          top_p: request.config?.topP,
          max_tokens: maxTokens,
          tools: convertTools(request.config?.tools),
          response_format:
            request.config?.responseMimeType === 'application/json'
              ? { type: 'json_object' }
              : undefined,
          stream: false,
        });

        return convertToGeminiResponse(
          completion as OpenAI.Chat.ChatCompletion,
        );
      } catch (error) {
        throw convertError(error);
      }
    },

    async generateContentStream(
      request: GenerateContentParameters,
      userPromptId: string,
    ): Promise<AsyncGenerator<GenerateContentResponse>> {
      return doGenerateContentStream(request);
    },

    async countTokens(
      request: CountTokensParameters,
    ): Promise<CountTokensResponse> {
      // OpenRouter doesn't have a dedicated token counting endpoint
      // We'll estimate based on the tiktoken library or return a placeholder
      // For now, return an estimate based on content length
      const contents = normalizeContents(request.contents);
      const totalText = contents
        .map(
          (content: Content) =>
            content.parts
              ?.map((part: Part) => {
                if ('text' in part && part.text) return part.text;
                return '';
              })
              .join(' ') || '',
        )
        .join(' ');

      // Rough estimate: 1 token per 4 characters
      const estimatedTokens = Math.ceil(totalText.length / 4);

      return {
        totalTokens: estimatedTokens,
        cachedContentTokenCount: 0,
      };
    },

    async embedContent(
      _request: EmbedContentParameters,
    ): Promise<EmbedContentResponse> {
      // OpenRouter doesn't support embeddings for Gemini models
      throw new Error(
        'Embeddings are not supported through OpenRouter for Gemini models',
      );
    },
  };

  return openRouterContentGenerator;
}

function normalizeContents(contents: ContentUnion | ContentUnion[]): Content[] {
  if (typeof contents === 'string') {
    return [{ role: 'user', parts: [{ text: contents }] }];
  }

  if (Array.isArray(contents)) {
    return contents.map((content) => {
      if (typeof content === 'string') {
        return { role: 'user', parts: [{ text: content }] };
      }
      // Check if it's a PartUnion[] (old format)
      if (Array.isArray(content)) {
        // Convert Part[] to Content
        const parts: Part[] = content.map((part) => {
          if (typeof part === 'string') {
            return { text: part };
          }
          return part;
        });
        return { role: 'user', parts };
      }
      return content as Content;
    });
  }

  return [contents as Content];
}

function extractSystemInstruction(
  request: GenerateContentParameters,
): string | undefined {
  const instruction = request.config?.systemInstruction;
  if (!instruction) return undefined;

  if (typeof instruction === 'string') {
    return instruction;
  }

  if ('parts' in instruction && instruction.parts) {
    return instruction.parts
      .map((part: Part) => ('text' in part && part.text ? part.text : ''))
      .join('\n');
  }

  return undefined;
}

function convertToOpenAIFormat(
  request: GenerateContentParameters,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const contents = normalizeContents(request.contents);

  return contents
    .map((content: Content) => {
      const role =
        content.role === 'model' ? 'assistant' : (content.role as string);
      const parts = content.parts || [];

      // Handle single text part
      if (parts.length === 1 && parts[0] && 'text' in parts[0]) {
        return {
          role: role as 'user' | 'assistant',
          content: parts[0].text || '',
        };
      }

      // Handle function calls
      const functionCalls = parts.filter(
        (part: Part) => part && 'functionCall' in part,
      );

      if (functionCalls.length > 0 && role === 'assistant') {
        const toolCalls = functionCalls
          .map((part: Part, index: number) => {
            const functionCall = part.functionCall;
            if (!functionCall) return null;

            return {
              id: functionCall.id || `call_${index}`,
              type: 'function' as const,
              function: {
                name: functionCall.name || '',
                arguments: JSON.stringify(functionCall.args || {}),
              },
            };
          })
          .filter(Boolean);

        return {
          role: 'assistant' as const,
          content: null,
          tool_calls: toolCalls as OpenAI.Chat.ChatCompletionMessageToolCall[],
        };
      }

      // Handle function responses
      const functionResponses = parts.filter(
        (part: Part) => part && 'functionResponse' in part,
      );

      if (functionResponses.length > 0) {
        return functionResponses.map((part: Part, index: number) => ({
          role: 'tool' as const,
          tool_call_id: part.functionResponse?.name || `call_${index}`,
          content: JSON.stringify(part.functionResponse?.response || {}),
        }));
      }

      // Handle text parts
      const textParts = parts.filter((part: Part) => part && 'text' in part);
      const text = textParts
        .map((part: Part) => ('text' in part ? part.text || '' : ''))
        .join('\n');

      return {
        role: (role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: text,
      };
    })
    .flat();
}

import type { ToolListUnion, Tool as GenaiTool } from '@google/genai';

function convertTools(
  tools?: ToolListUnion,
): OpenAI.Chat.ChatCompletionTool[] | undefined {
  if (!tools) return undefined;
  
  // Normalize tools to array
  const toolsArray = Array.isArray(tools) ? tools : [tools];
  if (toolsArray.length === 0) return undefined;
  
  // Get the first tool (usually only one tool object with function declarations)
  const firstTool = toolsArray[0];
  if (!firstTool || typeof firstTool === 'string') return undefined;
  
  const functionDeclarations = (firstTool as GenaiTool).functionDeclarations;
  if (!functionDeclarations) return undefined;

  return functionDeclarations.map((func) => ({
    type: 'function' as const,
    function: {
      name: func.name || '',
      description: func.description || '',
      parameters: func.parameters as any,
    },
  }));
}

function convertChunkToGeminiResponse(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
): GenerateContentResponse {
  const choice = chunk.choices?.[0];
  if (!choice) {
    return {
      candidates: [],
    } as unknown as GenerateContentResponse;
  }

  const parts: Part[] = [];
  const delta = choice.delta;

  if (delta?.content) {
    parts.push({ text: delta.content });
  }

  if (delta?.tool_calls) {
    for (const toolCall of delta.tool_calls) {
      if (toolCall.function?.name) {
        // Only include complete function calls
        try {
          const args = toolCall.function.arguments 
            ? JSON.parse(toolCall.function.arguments)
            : {};
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args,
            },
          });
        } catch {
          // Skip incomplete function calls
        }
      }
    }
  }

  const candidate: Candidate = {
    content: {
      role: 'model',
      parts,
    },
    index: choice.index,
    finishReason: mapFinishReason(choice.finish_reason),
  };

  // Only return a response if we have content or a finish reason
  if (parts.length === 0 && !choice.finish_reason) {
    return {
      candidates: [],
    } as unknown as GenerateContentResponse;
  }

  const response = {
    candidates: [candidate],
  } as unknown as GenerateContentResponse;

  // Add usage metadata if available
  if (chunk.usage) {
    response.usageMetadata = {
      promptTokenCount: chunk.usage.prompt_tokens || 0,
      candidatesTokenCount: chunk.usage.completion_tokens || 0,
      totalTokenCount: chunk.usage.total_tokens || 0,
    };
  }

  return response;
}

function convertToGeminiResponse(
  completion: OpenAI.Chat.ChatCompletion,
): GenerateContentResponse {
  const choice = completion.choices[0];
  if (!choice) {
    throw new Error('No choices in OpenRouter response');
  }

  const parts: Part[] = [];
  
  if (choice.message.content) {
    parts.push({ text: choice.message.content });
  }
  
  if (choice.message.tool_calls) {
    for (const toolCall of choice.message.tool_calls) {
      parts.push({
        functionCall: {
          name: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments),
        },
      });
    }
  }

  const candidate: Candidate = {
    content: {
      role: 'model',
      parts,
    },
    index: 0,
    finishReason: mapFinishReason(choice.finish_reason),
  };

  const response = {
    candidates: [candidate],
  } as unknown as GenerateContentResponse;

  if (completion.usage) {
    response.usageMetadata = {
      promptTokenCount: completion.usage.prompt_tokens || 0,
      candidatesTokenCount: completion.usage.completion_tokens || 0,
      totalTokenCount: completion.usage.total_tokens || 0,
    };
  }

  return response;
}

function mapFinishReason(reason: string | null): FinishReason | undefined {
  if (!reason) return undefined;
  
  switch (reason) {
    case 'stop':
      return FinishReason.STOP;
    case 'length':
      return FinishReason.MAX_TOKENS;
    case 'content_filter':
      return FinishReason.SAFETY;
    case 'function_call':
    case 'tool_calls':
      return FinishReason.STOP;
    default:
      return FinishReason.OTHER;
  }
}

function convertError(error: any): Error {
  if (error instanceof OpenAI.APIError) {
    return new Error(
      `OpenRouter API error (${error.status}): ${error.message}`,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}