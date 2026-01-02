# YAGI

![Project Icon](assets/icon.png)

## YET! ANOTHER .GITIGNORE

A powerful Visual Studio Code extension that simplifies creating and managing `.gitignore` files for your projects. YAGI fetches up-to-date templates for various languages, frameworks, tools, and environments using the [Toptal gitignore API](https://www.toptal.com/developers/gitignore).

[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/anhkhoakz/yagi?label=Open%20VSX%20Downloads&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSI0LjYgNSA5Ni4yIDEyMi43IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0zMCA0NC4yTDUyLjYgNUg3LjN6TTQuNiA4OC41aDQ1LjNMMjcuMiA0OS40em01MSAwbDIyLjYgMzkuMiAyMi42LTM5LjJ6IiBmaWxsPSIjYzE2MGVmIi8+CiAgPHBhdGggZD0iTTUyLjYgNUwzMCA0NC4yaDQ1LjJ6TTI3LjIgNDkuNGwyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwTDU1LjYgODguNWg0NS4yeiIgZmlsbD0iI2E2MGVlNSIvPgo8L3N2Zz4=&labelColor=374151&color=60a5fa&style=for-the-badge)](http://open-vsx.org/extension/anhkhoakz/yagi)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/anhkhoakz.yagi?style=for-the-badge)](https://marketplace.visualstudio.com/items/?itemName=anhkhoakz.yagi)

## Features

### 🚀 Smart Template Suggestions

YAGI automatically detects your project type by analyzing common files (e.g., `package.json`, `pom.xml`, `requirements.txt`, `go.mod`) and suggests relevant templates. It also pre-selects OS-specific templates based on your platform.

### 👁️ Template Preview

Preview the generated `.gitignore` content before applying it to your project, ensuring you know exactly what will be ignored.

### ⚡ Quick Access

A convenient status bar item provides one-click access to generate `.gitignore` files without opening the command palette.

### 🔄 Flexible File Management

- Create a new `.gitignore` file from scratch
- Override an existing `.gitignore` file
- Append templates to an existing `.gitignore` file

### 📦 Always Up-to-Date

Fetches templates directly from the Toptal API, ensuring you always get the most recent and comprehensive ignore patterns.

### 💾 Intelligent Caching

Built-in caching system reduces API calls and improves performance, with configurable TTL settings.

## Usage

### Quick Start

1. Click the **GitIgnore** button in the status bar (bottom-right corner)
2. Select templates from the list (smart suggestions will be pre-selected)
3. Choose to create, override, or append to your `.gitignore` file

### Command Palette

1. Open the command palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS)
2. Run one of these commands:
   - **Generate .gitignore** - Create or update your `.gitignore` file
   - **Preview .gitignore from templates** - Preview templates before applying
   - **YAGI: Clear Cache** - Clear cached templates and content

### Smart Suggestions

YAGI automatically suggests templates based on:

- **Project files**: Detects Node, Python, Java, Go, Rust, Ruby, PHP, Unity, C/C++, and more
- **Operating system**: Automatically includes macOS, Windows, or Linux templates
- **User preferences**: Pre-selects templates defined in your settings

## Requirements

- Visual Studio Code 1.105.0 or later
- Active internet connection (to fetch templates from the API)
- An open workspace folder

## Configuration

YAGI can be customized through VS Code settings:

| Setting | Type | Default | Description |
| ------- | ---- | ------- | ----------- |
| `yagi.templateListTtl` | number | `86400000` | Cache duration for template list (24 hours in ms) |
| `yagi.gitignoreCacheTtl` | number | `3600000` | Cache duration for gitignore content (1 hour in ms) |
| `yagi.maxCacheSize` | number | `100` | Maximum number of cached gitignore templates |
| `yagi.defaultTemplates` | array | `[]` | Templates to pre-select (e.g., `["node", "vscode"]`) |
| `yagi.customApiEndpoint` | string | `null` | Custom API endpoint for gitignore templates |
| `yagi.customGitignorePath` | string | `".gitignore"` | Custom path for .gitignore file (relative to workspace root) |

### Example Configuration

```json
{
    "yagi.templateListTtl": 86400000,
    "yagi.gitignoreCacheTtl": 3600000,
    "yagi.maxCacheSize": 100,
    "yagi.defaultTemplates": ["node", "vscode", "macos"],
    "yagi.customGitignorePath": ".gitignore"
}
```

## Supported Project Types

YAGI automatically detects and suggests templates for:

- **JavaScript/TypeScript**: Node.js projects (detects `package.json`, `yarn.lock`, `pnpm-lock.yaml`)
- **Python**: Python projects (detects `requirements.txt`, `pyproject.toml`)
- **Java**: Maven and Gradle projects (detects `pom.xml`, `build.gradle`)
- **Go**: Go modules (detects `go.mod`)
- **Rust**: Cargo projects (detects `Cargo.toml`)
- **Ruby**: Bundler projects (detects `Gemfile`)
- **PHP**: Composer projects (detects `composer.json`)
- **Unity**: Unity game engine projects (detects `Packages/manifest.json`, `Assets`)
- **C/C++**: CMake projects (detects `CMakeLists.txt`)
- **Operating Systems**: macOS, Windows, Linux

## Known Issues

- Requires an active internet connection to fetch templates
- Only works within VS Code workspace folders
- Template detection is based on common project files and may not cover all edge cases

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## License

 For more information, see [LICENSE](LICENSE).
