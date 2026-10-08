# Contributing to LingapLink

First off, thank you for considering contributing to LingapLink! It's people like you that make LingapLink such a great tool for healthcare management.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the expected behavior**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies** with `npm install`
3. **Make your changes** following our style guidelines
4. **Add tests** if applicable
5. **Ensure tests pass** with `npm run test`
6. **Run linting** with `npm run lint`
7. **Update documentation** if needed
8. **Submit your pull request**

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/carmen-para-sight.git
   cd carmen-para-sight
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new files
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow the existing file naming conventions

### CSS

- Use CSS Modules where applicable
- Follow BEM naming convention
- Use CSS custom properties for theming
- Ensure responsive design

### File Organization

```
src/
├── components/     # React components
├── services/       # Business logic
├── utils/          # Helper functions
├── types/          # TypeScript types
├── contexts/       # React contexts
├── config/         # Configuration
└── styles/         # Global styles
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
docs(readme): update installation instructions
```

## Security

⚠️ **Important**: This is a healthcare application with strict security requirements.

- Never commit sensitive data or credentials
- Follow healthcare data protection standards
- Report security vulnerabilities privately (see [SECURITY.md](SECURITY.md))
- Ensure all patient data is properly encrypted

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🎉
