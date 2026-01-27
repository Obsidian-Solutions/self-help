---
title: 'Installation'
weight: 10
---

Follow these steps to get your local development environment up and running.

## 1. Prerequisites

- **Hugo (Extended)**: v0.120.0 or higher.
- **Node.js**: v18.0.0 or higher.
- **npm**: v9.0.0 or higher.

## 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Obsidian-Solutions/self-help.git
cd self-help

# Install dependencies
npm install
```

## 3. Initialize the CMS

The CMS handles authentication and secure content storage.

```bash
cd cms
npm install
npm run init-db
cd ..
```

## 4. Run Development Servers

MindFull requires both the Hugo server and the Node.js CMS to be running.

```bash
# Start both Frontend and Backend in one command
npm run dev
```

Your site will be available at `http://localhost:1313`.
