<div style="text-align: center">

<p><img src="assets/icon.png" width="200" alt="Project Icon"></p>

# YAGI

### YET! ANOTHER .GITIGNORE

A Visual Studio Code tool called YAGI facilitates the rapid creation and administration of .gitignore files for your projects. It retrieves current templates for a variety of languages, tools, and environments using the [Toptal gitignore API](https://www.toptal.com/developers/gitignore).

[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/anhkhoakz/yagi?label=Open%20VSX%20Downloads&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSI0LjYgNSA5Ni4yIDEyMi43IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0zMCA0NC4yTDUyLjYgNUg3LjN6TTQuNiA4OC41aDQ1LjNMMjcuMiA0OS40em01MSAwbDIyLjYgMzkuMiAyMi42LTM5LjJ6IiBmaWxsPSIjYzE2MGVmIi8+CiAgPHBhdGggZD0iTTUyLjYgNUwzMCA0NC4yaDQ1LjJ6TTI3LjIgNDkuNGwyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwTDU1LjYgODguNWg0NS4yeiIgZmlsbD0iI2E2MGVlNSIvPgo8L3N2Zz4=&labelColor=374151&color=60a5fa&style=for-the-badge)](http://open-vsx.org/extension/anhkhoakz/yagi)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/anhkhoakz.yagi?style=for-the-badge)](https://marketplace.visualstudio.com/items/?itemName=anhkhoakz.yagi)
</div>

## Features

 Create a fresh.gitignore file using the templates you've chosen (e.g., node, macos, vscode, etc.)

- Replace or add to an already-existing .gitignore file
- Gets templates straight from the Toptal API, so you're always getting the most recent suggestions.

## Application

 1. Launch the command palette (Ctrl+Shift+P on Windows/Linux, `Cmd+Shift+P` on macOS).
 2. Type `Generate .gitignore` into the command bar.
 3. Choose one or more templates (such as `node`, `macos`, or `vscode`) from the list.
 4. If a .gitignore already exists, decide whether to append or override it.
 5. Review the generated .gitignore file to ensure it meets your project's needs.

## Conditions

 A working Internet connection (to retrieve templates from the API) and Visual Studio Code 1.99.0 or later

## Settings for Extensions

 No custom settings are added by this plugin.

## Recognized Problems

 In order to retrieve templates, an internet connection is necessary.
 It only functions in folders that are opened in Visual Studio Code as a workspace.

## Notes on Release

### 1.0.0-First release: Use the Toptal API to create and manage .gitignore files

### 1.0.1-Added the ability to append to an existing .gitignore file, update README

 ---

## License

 For more information, see [LICENSE](LICENSE).
