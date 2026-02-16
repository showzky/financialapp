# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning principles.

## [Unreleased]

## [1.0.0] - 2026-02-16
### Added
- Initial React + TypeScript + Vite project setup for the Financial App.
- Neumorphic UI foundation with shared theme styles and reusable UI primitives.
- Budget dashboard flow with category cards, summary stats, and progress visuals.
- Category management modal and income update modal for core budgeting workflows.
- History views and snapshot components for transaction and trend visibility.
- Recurring manager and automation toast for recurring finance logic.
- Context providers and hooks for budget and finance state management.
- Utility modules for currency formatting and pay period logic.
- Test setup with initial utility tests.

### Changed
- Refined project structure into focused folders for components, context, hooks, pages, layouts, styles, tests, types, and utilities.
- Improved consistency of component naming and dashboard composition for maintainability.

### Infrastructure
- Configured Tailwind CSS, PostCSS, ESLint, TypeScript project configs, Vitest, and Vite build tooling.
- Added repository hygiene rules in `.gitignore` for dependencies, build artifacts, environment files, and editor workspace files.
