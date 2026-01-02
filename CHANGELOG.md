# Change Log

All notable changes to the "YAGI" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-04-19

### Added

- Initial release of YAGI extension
- Generate .gitignore files using the Toptal gitignore API
- Select multiple templates for .gitignore generation
- Option to override or append to existing .gitignore
- Command palette integration

## [0.0.2] - 2025-04-20

### Changed

- Update README with usage instructions

## [0.0.3] - 2025-04-21

### Added

- Implement caching for gitignore templates
- Add clear cache command

## [0.1.0] - 2025-10-11

### Changed

- Enhance UX
- Update dependencies

## [0.1.2] - 2025-10-14

### Added

- **Smart Template Suggestions**: Automatically detects project type by analyzing common files
  - Detects Node.js projects (`package.json`, `yarn.lock`, `pnpm-lock.yaml`)
  - Detects Python projects (`requirements.txt`, `pyproject.toml`)
  - Detects Java projects (Maven `pom.xml`, Gradle `build.gradle`)
  - Detects Go, Rust, Ruby, PHP, Unity, and C/C++ projects
  - Automatically suggests OS-specific templates (macOS, Windows, Linux)
- **Template Preview Command**: New `Preview .gitignore from templates` command to preview generated content before applying
- **Status Bar Item**: Quick access button in the status bar for one-click gitignore generation
- **Auto-detection**: Intelligent project type detection based on workspace files

### Changed

- Enhanced template picker with smart pre-selection based on project detection
- Improved user experience with better visual feedback
- Updated README with comprehensive feature documentation

### Technical

- Refactored `showTemplatePicker` to support async project detection
- Added `detectProjectType` method for intelligent template suggestions
- Added `showTemplatePreview` method for preview functionality
- Added `previewGitignore` command handler
- Implemented status bar item with proper lifecycle management

## [Unreleased]

### Planned Features

- Custom template presets (save frequently used template combinations)
- Diff view before applying changes to existing .gitignore
- Template categories and tags for better organization
- Multi-root workspace support
- Template update notifications
- GitIgnore validation and analysis
- Context menu integration
- AI-powered suggestions based on usage patterns
