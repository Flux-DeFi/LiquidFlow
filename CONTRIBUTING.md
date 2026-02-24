
---

# Contributing to FlowFi

Thank you for your interest in contributing to **FlowFi**

FlowFi is a DeFi payment streaming protocol built on Stellar using Soroban smart contracts. This guide explains how to set up your local development environment and contribute effectively.

Please read this document carefully before opening a Pull Request.

---

##  Table of Contents

* [Project Overview](#project-overview)
* [Local Development Setup](#local-development-setup)
* [Branching Strategy](#branching-strategy)
* [Commit Guidelines & Hooks](#commit-guidelines--hooks)
* [Bug Reporting Guidelines](#bug-reporting-guidelines)
* [Pull Request Process](#pull-request-process)
* [External Developer Guidelines](#external-developer-guidelines)
* [Code of Conduct](#code-of-conduct)

---

##  Project Overview

FlowFi is structured as a monorepo:

```
flowfi/
├── backend/      # Express.js + TypeScript backend
├── contracts/    # Soroban smart contracts (Rust)
├── frontend/     # Next.js + Tailwind CSS frontend
```

Technologies used:

* **Frontend**: Next.js + TypeScript + Tailwind CSS
* **Backend**: Express.js + TypeScript
* **Smart Contracts**: Rust + Soroban
* **Database**: PostgreSQL
* **Containerization**: Docker & Docker Compose

---

#  Local Development Setup


##  Fork & Clone the Repository

Fork & Clone the Repository

First, fork the repository on GitHub.

Then clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/flowfi.git
cd flowfi
```

##  Prerequisites

Make sure you have the following installed:

* Node.js (LTS recommended)
* npm
* Rust & Cargo
* Docker & Docker Compose
* (Optional) Stellar CLI

---

##  Option 1: Docker (Recommended)

The fastest way to run the full stack locally:

```bash
docker compose up --build
```

This starts:

* PostgreSQL (port 5432)
* Backend API (port 3001)

To run in detached mode:

```bash
docker compose up -d --build
```

To stop services:

```bash
docker compose down
```

To reset the database:

```bash
docker compose down -v
```

---

##  Option 2: Manual Setup

###  Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```
http://localhost:3001
```

---

### 2️ Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

### 3️ Smart Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

---

#  Branching Strategy

❌ Do NOT commit directly to `main`
✅ Always create a feature branch

## Branch Naming Convention

| Type     | Format                       | Example                       |
| -------- | ---------------------------- | ----------------------------- |
| Feature  | `feature/short-description`  | `feature/add-stream-cancel`   |
| Bug Fix  | `fix/short-description`      | `fix/dashboard-loading-error` |
| Refactor | `refactor/short-description` | `refactor/api-service-layer`  |
| Docs     | `docs/short-description`     | `docs/update-contributing`    |
| Infra    | `infra/short-description`    | `infra/docker-improvement`    |

## Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Keep branch names short and descriptive.

---

#  Commit Guidelines & Hooks

This repository uses **Husky** for commit hooks.

Before committing, ensure:

* Code compiles
* Lint passes
* No broken builds

## Commit Message Format

We follow a conventional style:

```
type(scope): short description
```

### Examples

```
feat(frontend): add wallet balance card
fix(backed): resolve stream validation bug
refactor(contracts): simplify transfer logic
docs: update setup instructions
```

## Commit Rules

* Use present tense ("add", not "added")
* Keep subject under ~72 characters
* Make atomic commits (one logical change per commit)
* Avoid vague messages like "update stuff"

---

#  Bug Reporting Guidelines

##  How to Report a Bug

Before creating a bug report, please check existing issues to avoid duplicates.

###  Bug Report Template

When filing a bug report, please include:

* **Title**: Clear and descriptive summary of the issue
* **Description**: Detailed explanation of the problem
* **Steps to Reproduce**: Step-by-step instructions to reproduce the issue
* **Expected Behavior**: What you expected to happen
* **Actual Behavior**: What actually happened
* **Environment**:
  * OS and version
  * Browser version (if applicable)
  * Node.js version (if applicable)
  * Any other relevant environment details
* **Screenshots**: If applicable, add screenshots to help explain your problem
* **Additional Context**: Any other context about the problem

###  Bug Report Labels

Maintainers will label bug reports with:
* `bug`: Confirmed bug
* `needs-reproduction`: Needs more information to reproduce
* `wont-fix`: Not a bug or out of scope
* `duplicate`: Duplicate of an existing issue

---

#  Pull Request Process

##  Sync with Main

Before opening a PR:

```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

Resolve conflicts locally if any.

---

##  Push Your Branch

```bash
git push origin your-branch-name
```

---

## 3 Open a Pull Request

When opening your PR:

* Provide a clear title
* Add a detailed description
* Link related issues (e.g., `Closes #45`)
* Add screenshots for UI changes
* Explain why the change is needed

---

##  PR Requirements

Your PR must:

* Build successfully
* Pass lint checks
* Follow commit conventions
* Be properly described
* Stay focused (avoid large unrelated changes)

---

##  Code Review

Maintainers may:

* Request changes
* Ask clarifying questions
* Suggest improvements

Please respond respectfully and update your branch as requested.

---

#  External Developer Guidelines

##  For External Contributors

We welcome contributions from external developers! This section provides specific guidelines for those outside the core team.

###  Getting Started

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following our coding standards
4. Test your changes thoroughly
5. Submit a pull request with a clear description

###  What We Accept

We welcome contributions in the following areas:

* **Bug fixes**: Fixes for issues reported in the bug tracker
* **Documentation**: Improvements to documentation, README, and guides
* **Features**: New features that align with our roadmap
* **Performance**: Optimizations and performance improvements
* **Tests**: Additional test coverage for existing functionality

###  What We Don't Accept

* Major architectural changes without prior discussion
* Changes that break existing APIs without migration path
* Features outside our project scope
* PRs with failing tests or lint errors

###  Communication

* For questions: Use GitHub Discussions
* For bug reports: Create an issue using the bug template
* For feature requests: Create an issue with the "enhancement" label
* For security issues: See our security policy

###  Review Process

All external contributions go through our review process:

1. Automated checks (lint, tests)
2. Code review by maintainers
3. Possible request for changes
4. Approval and merge by maintainers

###  Recognition

Contributors who make significant contributions will be recognized in:
* Our contributors list
* Release notes (for significant features)
* Project documentation

---

# 📜 Code of Conduct

This project follows a Code of Conduct to ensure a welcoming and inclusive community.

Please read and follow our Code of Conduct before contributing:

 **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**

Be respectful.
Be collaborative.
Be constructive.

---

#  Final Notes

* Contributions of all sizes are welcome
* Documentation improvements are valuable
* Ask questions in Issues if unsure
* Keep PRs small and manageable

Thank you for helping improve FlowFi 💙
