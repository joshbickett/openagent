# OpenAgent

[![Version](https://img.shields.io/npm/v/@bickett/openagent)](https://www.npmjs.com/package/@bickett/openagent)
[![License](https://img.shields.io/github/license/joshbickett/openagent)](https://github.com/joshbickett/openagent/blob/main/LICENSE)

<!-- ![Gemini CLI Screenshot](./docs/assets/gemini-screenshot.png) -->

OpenAgent is an open-source AI coding agent that brings powerful AI models directly into your terminal. A fork of Google's Gemini CLI, it provides access to all major coding AI models from x-ai, anthropic, qwen, google, openai, more - combining the robust features of Gemini CLI with the flexibility to use any model you prefer.

## 🚀 Why OpenAgent?

- **🤖 Multi-model support**: Use Gemini, GPT, Claude, and other coding AI models
- **🎯 Free tier**: 60 requests/min and 1,000 requests/day with Gemini (via Google account)
- **🧠 Powerful models**: Access Gemini 2.5 Pro (1M context), GPT-4, Claude 3.5, and more
- **🔧 Built-in tools**: Google Search grounding, file operations, shell commands, web fetching
- **🔌 Extensible**: MCP (Model Context Protocol) support for custom integrations
- **💻 Terminal-first**: Designed for developers who live in the command line
- **🛡️ Open source**: Apache 2.0 licensed

## 📦 Installation

### Quick Install

#### Run instantly with npx

```bash
# Using npx (no installation required)
npx @bickett/openagent
```

#### Install globally with npm

```bash
npm install -g @bickett/openagent
```


#### System Requirements

- Node.js version 20 or higher
- macOS, Linux, or Windows

## Release Cadence and Tags

See [Releases](./docs/releases.md) for more details.

### Preview

New preview releases will be published each week at UTC 2359 on Tuesdays. These releases will not have been fully vetted and may contain regressions or other outstanding issues. Please help us test and install with `preview` tag.

```bash
npm install -g @bickett/openagent@latest
```

### Stable

- New stable releases will be published each week at UTC 2000 on Tuesdays, this will be the full promotion of last week's `preview` release + any bug fixes and validations. Use `latest` tag.

```bash
npm install -g @bickett/openagent@latest
```

### Nightly

- New releases will be published each week at UTC 0000 each day, This will be all changes from the main branch as represented at time of release. It should be assumed there are pending validations and issues. Use `nightly` tag.

```bash
npm install -g @bickett/openagent@nightly
```

## 📋 Key Features

### Code Understanding & Generation

- Query and edit large codebases
- Generate new apps from PDFs, images, or sketches using multimodal capabilities
- Debug issues and troubleshoot with natural language

### Automation & Integration

- Automate operational tasks like querying pull requests or handling complex rebases
- Use MCP servers to connect new capabilities, including [media generation with Imagen, Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Run non-interactively in scripts for workflow automation

### Advanced Capabilities

- Ground your queries with built-in [Google Search](https://ai.google.dev/gemini-api/docs/grounding) for real-time information
- Conversation checkpointing to save and resume complex sessions
- Custom context files (OPENAGENT.md) to tailor behavior for your projects

### GitHub Integration

Integrate OpenAgent directly into your GitHub workflows (using the original [**Gemini CLI GitHub Action**](https://github.com/google-github-actions/run-gemini-cli)):

- **Pull Request Reviews**: Automated code review with contextual feedback and suggestions
- **Issue Triage**: Automated labeling and prioritization of GitHub issues based on content analysis
- **On-demand Assistance**: Mention `@openagent` in issues and pull requests for help with debugging, explanations, or task delegation
- **Custom Workflows**: Build automated, scheduled and on-demand workflows tailored to your team's needs

## 🔐 Authentication Options

Choose the authentication method that best fits your needs:

> **Note**: Google OAuth login is not available in OpenAgent. Use one of the following authentication methods instead.

### Option 1: Gemini API Key

**✨ Best for:** Developers who need specific model control or paid tier access

**Benefits:**

- **Free tier**: 100 requests/day with Gemini 2.5 Pro
- **Model selection**: Choose specific Gemini models
- **Usage-based billing**: Upgrade for higher limits when needed

```bash
# Get your key from https://aistudio.google.com/apikey
export GEMINI_API_KEY="YOUR_API_KEY"
openagent
```

### Option 2: Vertex AI

**✨ Best for:** Enterprise teams and production workloads

**Benefits:**

- **Enterprise features**: Advanced security and compliance
- **Scalable**: Higher rate limits with billing account
- **Integration**: Works with existing Google Cloud infrastructure

```bash
# Get your key from Google Cloud Console
export GOOGLE_API_KEY="YOUR_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=true
openagent
```

### Option 3: OpenRouter

**✨ Best for:** Developers who want access to multiple AI models beyond Gemini

**Benefits:**

- **Multi-model access**: Use Gemini, Claude, GPT-4, Llama, and many more models
- **Unified API**: Single API key for all models
- **Flexible routing**: Automatically route to available providers
- **Usage-based billing**: Pay only for what you use across all models

```bash
# Get your key from https://openrouter.ai
export OPENROUTER_API_KEY="YOUR_API_KEY"
openagent
```

For more details on OpenRouter support, see the [OpenRouter guide](./docs/openrouter.md).

For Google Workspace accounts and other authentication methods, see the [authentication guide](./docs/cli/authentication.md).

## 🚀 Getting Started

### Basic Usage

#### Start in current directory

```bash
openagent
```

#### Include multiple directories

```bash
openagent --include-directories ../lib,../docs
```

#### Use specific model

```bash
openagent -m gemini-2.5-flash
```

#### Non-interactive mode for scripts

Get a simple text response:

```bash
openagent -p "Explain the architecture of this codebase"
```

For more advanced scripting, including how to parse JSON and handle errors, use
the `--output-format json` flag to get structured output:

```bash
openagent -p "Explain the architecture of this codebase" --output-format json
```

### Quick Examples

#### Start a new project

```bash
cd new-project/
openagent
> Write me a Discord bot that answers questions using a FAQ.md file I will provide
```

#### Analyze existing code

```bash
git clone https://github.com/joshbickett/openagent
cd openagent
openagent
> Give me a summary of all of the changes that went in yesterday
```

## 📚 Documentation

### Getting Started

- [**Quickstart Guide**](./docs/cli/index.md) - Get up and running quickly
- [**Authentication Setup**](./docs/cli/authentication.md) - Detailed auth configuration
- [**Configuration Guide**](./docs/cli/configuration.md) - Settings and customization
- [**Keyboard Shortcuts**](./docs/keyboard-shortcuts.md) - Productivity tips

### Core Features

- [**Commands Reference**](./docs/cli/commands.md) - All slash commands (`/help`, `/chat`, `/mcp`, etc.)
- [**Checkpointing**](./docs/checkpointing.md) - Save and resume conversations
- [**Memory Management**](./docs/tools/memory.md) - Using OPENAGENT.md context files
- [**Token Caching**](./docs/cli/token-caching.md) - Optimize token usage

### Tools & Extensions

- [**Built-in Tools Overview**](./docs/tools/index.md)
  - [File System Operations](./docs/tools/file-system.md)
  - [Shell Commands](./docs/tools/shell.md)
  - [Web Fetch & Search](./docs/tools/web-fetch.md)
  - [Multi-file Operations](./docs/tools/multi-file.md)
- [**MCP Server Integration**](./docs/tools/mcp-server.md) - Extend with custom tools
- [**Custom Extensions**](./docs/extension.md) - Build your own commands

### Advanced Topics

- [**Architecture Overview**](./docs/architecture.md) - How OpenAgent works
- [**IDE Integration**](./docs/ide-integration.md) - VS Code companion
- [**Sandboxing & Security**](./docs/sandbox.md) - Safe execution environments
- [**Enterprise Deployment**](./docs/deployment.md) - Docker, system-wide config
- [**Telemetry & Monitoring**](./docs/telemetry.md) - Usage tracking
- [**Tools API Development**](./docs/core/tools-api.md) - Create custom tools

### Configuration & Customization

- [**Settings Reference**](./docs/cli/configuration.md) - All configuration options
- [**Theme Customization**](./docs/cli/themes.md) - Visual customization
- [**.openagent Directory**](./docs/openagent-ignore.md) - Project-specific settings
- [**Environment Variables**](./docs/cli/configuration.md#environment-variables)

### Troubleshooting & Support

- [**Troubleshooting Guide**](./docs/troubleshooting.md) - Common issues and solutions
- [**FAQ**](./docs/troubleshooting.md#frequently-asked-questions) - Quick answers
- Use `/bug` command to report issues directly from the CLI

### Using MCP Servers

Configure MCP servers in `~/.openagent/settings.json` to extend OpenAgent with custom tools:

```text
> @github List my open pull requests
> @slack Send a summary of today's commits to #dev channel
> @database Run a query to find inactive users
```

See the [MCP Server Integration guide](./docs/tools/mcp-server.md) for setup instructions.

## 🤝 Contributing

We welcome contributions! OpenAgent is fully open source (Apache 2.0), and we encourage the community to:

- Report bugs and suggest features
- Improve documentation
- Submit code improvements
- Share your MCP servers and extensions

See our [Contributing Guide](./CONTRIBUTING.md) for development setup, coding standards, and how to submit pull requests.

Check the [Upstream Gemini CLI Roadmap](https://github.com/orgs/google-gemini/projects/11/) for reference.

## 📖 Resources

- **[Official Roadmap](./ROADMAP.md)** - See what's coming next
- **[NPM Package](https://www.npmjs.com/package/@bickett/openagent)** - Package registry
- **[GitHub Issues](https://github.com/joshbickett/openagent/issues)** - Report bugs or request features
- **[Security Advisories](https://github.com/google-gemini/gemini-cli/security/advisories)** - Security updates from upstream (Note: OpenAgent updates less frequently than Gemini CLI but will incorporate security updates regularly)

### Uninstall

See the [Uninstall Guide](docs/Uninstall.md) for removal instructions.

## 📄 Legal

- **License**: [Apache License 2.0](LICENSE)
- **Terms of Service**: [Terms & Privacy](./docs/tos-privacy.md)
- **Security**: [Security Policy](SECURITY.md)

---

## 🙏 Credits

OpenAgent is a fork of [Gemini CLI](https://github.com/google-gemini/gemini-cli) by Google. All credit for the original implementation goes to the Google team and contributors.

<p align="center">
  Originally built with ❤️ by Google and the open source community<br>
  Forked and maintained by <a href="https://github.com/joshbickett">Josh Bickett</a>
</p>
