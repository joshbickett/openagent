# Using OpenRouter with OpenAgent

OpenRouter support allows you to use various AI models through the OpenRouter API gateway. This provides access to models from multiple providers including Google's Gemini, Anthropic's Claude, OpenAI's GPT models, and many others through a unified API interface.

## Setup

1. **Get an OpenRouter API Key**
   - Sign up at [OpenRouter.ai](https://openrouter.ai)
   - Create an API key from your dashboard
   - Add credits to your account

2. **Set Environment Variable**
   ```bash
   export OPENROUTER_API_KEY="your-api-key-here"
   ```

   Or add it to your `.env` file:
   ```
   OPENROUTER_API_KEY=your-api-key-here
   ```

3. **Optional: Custom Base URL**
   If you're using a custom OpenRouter endpoint:
   ```bash
   export OPENROUTER_BASE_URL="https://your-custom-endpoint.com/api/v1"
   ```

## Usage

### Interactive Mode

1. Start OpenAgent:
   ```bash
   openagent
   ```

2. When prompted for authentication method, select **"OpenRouter"**

3. The CLI will automatically use your OpenRouter API key

### Non-Interactive Mode

OpenRouter will be used automatically if you have the API key set:
```bash
echo "What is the capital of France?" | openagent
```

## Supported Models

### Gemini Models (via OpenRouter)
The following Gemini models are automatically mapped to their OpenRouter equivalents:

- `gemini-2.5-pro` → `google/gemini-2.5-pro`
- `gemini-2.5-flash` → `google/gemini-2.5-flash`
- `gemini-2.5-pro-preview` → `google/gemini-2.5-pro-preview`
- `gemini-2.5-flash-preview` → `google/gemini-2.5-flash-preview`
- `gemini-2.0-flash-thinking-exp` → `google/gemini-2.0-flash-thinking-exp`
- `gemini-2.0-flash-exp` → `google/gemini-2.0-flash-exp`
- `gemini-pro` → `google/gemini-pro`
- `gemini-pro-vision` → `google/gemini-pro-vision`
- `gemini-1.5-pro` → `google/gemini-pro-1.5`
- `gemini-1.5-flash` → `google/gemini-flash-1.5`

### Other Available Models
You can also use any model available on OpenRouter by specifying its full name:

- **Anthropic**: `anthropic/claude-3.5-sonnet`, `anthropic/claude-3-opus`
- **OpenAI**: `openai/gpt-4-turbo`, `openai/gpt-4o`
- **Meta**: `meta-llama/llama-3-70b-instruct`
- **And many more!**

Check [OpenRouter models page](https://openrouter.ai/models) for the full list and pricing.

## Model Selection

To use a specific model, you can:

1. Set it in your settings:
   ```bash
   openagent config set model "anthropic/claude-3.5-sonnet"
   ```

2. Or specify it per request:
   ```bash
   echo "Explain quantum computing" | openagent --model "openai/gpt-4o"
   ```

## Features

- ✅ Text generation
- ✅ Streaming responses
- ✅ Function calling
- ✅ JSON mode
- ✅ Multiple model providers
- ❌ Embeddings (not supported for Gemini models via OpenRouter)

## Pricing

OpenRouter charges per token based on the model used. Pricing varies significantly between models:
- Gemini models: Generally competitive pricing
- Claude models: Premium pricing for advanced capabilities
- Open source models: Often more affordable

Check [OpenRouter pricing](https://openrouter.ai/models) for current rates.

## Best Practices

1. **Model Selection**: Choose models based on your use case:
   - Fast responses: Use `gemini-2.5-flash` or similar
   - Complex reasoning: Use `gemini-2.5-pro` or `anthropic/claude-3.5-sonnet`
   - Cost-effective: Consider open source models

2. **Rate Limits**: OpenRouter has rate limits based on your account tier. Monitor your usage to avoid interruptions.

3. **API Key Security**: Never commit your API key to version control. Use environment variables or `.env` files.

## Troubleshooting

### "OPENROUTER_API_KEY not found" error
Make sure you've set the environment variable correctly:
```bash
echo $OPENROUTER_API_KEY
```

### Rate limiting errors
- Check your OpenRouter dashboard for usage limits
- Consider upgrading your account or reducing request frequency
- OpenAgent will automatically retry with backoff for temporary errors

### Model not available
Some models may have limited availability. Check the [OpenRouter status page](https://status.openrouter.ai) or try a different model.

### Performance differences
If you notice performance differences compared to using Gemini directly:
- OpenRouter adds a small latency overhead
- Some models may have different behavior or capabilities
- Try adjusting temperature or other parameters

## Advanced Configuration

### Provider Preferences
OpenRouter can route requests to different providers for the same model. While OpenAgent doesn't currently expose this, you can influence routing through model selection.

### Custom Headers
Advanced users can set custom headers by modifying the OpenRouter content generator, but this requires code changes.

## Migration from Gemini API

If you're migrating from direct Gemini API usage:
1. Your existing Gemini model names will work automatically
2. You'll have access to additional models
3. Billing will be through OpenRouter instead of Google
4. Some Gemini-specific features may not be available