/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { AuthType } from '@google/gemini-cli-core';
import { MessageType } from '../types.js';
import { SettingScope } from '../../config/settings.js';

// Popular OpenRouter models for quick access
const OPENROUTER_MODELS = [
  // Top tier models
  'x-ai/grok-code-fast-1',
  'anthropic/claude-sonnet-4',
  'qwen/qwen3-coder',
  'openrouter/sonoma-sky-alpha',
  
  // Google models
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'gemini-2.5-pro',  // Keep for compatibility
  'gemini-2.5-flash', // Keep for compatibility
  
  // OpenAI models
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-4o',
  
  // Anthropic models
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  
  // Open source models
  'meta-llama/llama-3-70b-instruct',
  'mistralai/mixtral-8x7b-instruct',
];

export const modelCommand: SlashCommand = {
  name: 'model',
  altNames: ['m'],
  description: 'Switch AI models (OpenRouter only)',
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const { services, invocation } = context;
    const args = invocation?.args || '';
    
    const authType = services.settings.merged.security?.auth?.selectedType;
    const isOpenRouter = authType === AuthType.USE_OPENROUTER;
    const currentModel = services.config?.getModel() || 'gemini-2.5-pro';

    let message: string;

    // If not using OpenRouter, inform the user
    if (!isOpenRouter) {
      message = `The /model command is only available when using OpenRouter authentication.
Current model: ${currentModel}
To switch models with Gemini API, use the --model CLI argument when starting.`;
    }
    // If no args, show current model and available models
    else if (!args.trim()) {
      message = `Current model: ${currentModel}

Available models (use /model <name> to switch):
${OPENROUTER_MODELS.map(m => `  • ${m}`).join('\n')}

You can also use any model from https://openrouter.ai/models`;
    }
    // Switch to new model
    else {
      const newModel = args.trim();
      
      // Update the model in settings
      services.settings.setValue(SettingScope.User, 'model', newModel);
      
      // Update the runtime config
      services.config?.setModel(newModel);

      message = `✓ Model switched to: ${newModel}
Your next message will use the new model.`;
    }

    // Add the message to the UI
    context.ui.addItem({
      type: MessageType.INFO,
      text: message,
    }, Date.now());
  },
};