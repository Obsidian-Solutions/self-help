const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');
const auth = require('../middleware/auth');

const CONTENT_DIR = path.join(__dirname, '../../content');

// Helper to sanitize path and ensure it is within CONTENT_DIR
const safePath = (...paths) => {
  const joined = path.join(CONTENT_DIR, ...paths);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(CONTENT_DIR))) {
    throw new Error('Access denied: path is outside content directory');
  }
  return resolved;
};

// Helper to get all files in a collection
router.get('/:collection', auth, async (req, res) => {
  try {
    const { collection } = req.params;
    const collectionPath = safePath(collection);

    if (!(await fs.pathExists(collectionPath))) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const files = await fs.readdir(collectionPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    const content = await Promise.all(
      mdFiles.map(async file => {
        const filePath = path.join(collectionPath, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content: body } = matter(fileContent);
        return {
          slug: file.replace('.md', ''),
          data,
          body: body.substring(0, 200) + '...', // Excerpt
        };
      }),
    );

    res.json(content);
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Get single entry
router.get('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content: body } = matter(fileContent);
    res.json({ data, body });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Create/Update entry
router.post('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const { data, body } = req.body;
    const filePath = safePath(collection, `${slug}.md`);

    const fileContent = matter.stringify(body || '', data || {});
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, fileContent, 'utf8');
    res.json({ message: 'Entry saved successfully', slug });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// Delete entry
router.delete('/:collection/:slug', auth, async (req, res) => {
  try {
    const { collection, slug } = req.params;
    const filePath = safePath(collection, `${slug}.md`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    await fs.remove(filePath);
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

module.exports = router;
