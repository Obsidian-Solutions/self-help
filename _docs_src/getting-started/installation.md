---
title: 'Installation'
weight: 10
---

Follow these steps to get your local development environment up and running.

## 1. Prerequisites

> [!NOTE]
> Ensure you have the following tools installed before proceeding.

| Tool                | Version   | Purpose                 |
| :------------------ | :-------- | :---------------------- |
| **Hugo (Extended)** | v0.120.0+ | Static Site Generation  |
| **Node.js**         | v18.0.0+  | CSS & Backend execution |
| **npm**             | v9.0.0+   | Dependency management   |

### Readiness Checklist

- [ ] Hugo Extended installed (`hugo version`)
- [ ] Node.js installed (`node -v`)
- [ ] npm installed (`npm -v`)

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

- [ ] **Step 3.1**: Enter the CMS directory.
- [ ] **Step 3.2**: Install backend dependencies.
- [ ] **Step 3.3**: Initialize the local SQLite database.

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

### Local Access Points

| Service           | URL                     | Port |
| :---------------- | :---------------------- | :--- |
| **Main Site**     | `http://localhost:1313` | 1313 |
| **Documentation** | `http://localhost:1314` | 1314 |
| **CMS Backend**   | `http://localhost:3000` | 3000 |
