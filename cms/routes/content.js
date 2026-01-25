const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const matter = require('gray-matter');
const auth = require('../middleware/auth');

const CONTENT_DIR = path.join(__dirname, '../../content');

// Helper to get all files in a collection
router.get('/:collection', auth, async (req, res) => {
  const { collection } = req.params;
  const collectionPath = path.join(CONTENT_DIR, collection);

  if (!await fs.pathExists(collectionPath)) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  try {
    const files = await fs.readdir(collectionPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));
    
    const content = await Promise.all(mdFiles.map(async (file) => {
      const filePath = path.join(collectionPath, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content: body } = matter(fileContent);
      return {
        slug: file.replace('.md', ''),
        data,
        body: body.substring(0, 200) + '...' // Excerpt
      };
    }));

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error reading collection', error: err.message });
  }
});

// Get single entry
router.get('/:collection/:slug', auth, async (req, res) => {
  const { collection, slug } = req.params;
  const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

  if (!await fs.pathExists(filePath)) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content: body } = matter(fileContent);
    res.json({ data, body });
  } catch (err) {
    res.status(500).json({ message: 'Error reading entry', error: err.message });
  }
});

// Create/Update entry
router.post('/:collection/:slug', auth, async (req, res) => {
  const { collection, slug } = req.params;
  const { data, body } = req.body;
  const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

  try {
    const fileContent = matter.stringify(body || '', data || {});
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, fileContent, 'utf8');
    res.json({ message: 'Entry saved successfully', slug });
  } catch (err) {
    res.status(500).json({ message: 'Error saving entry', error: err.message });
  }
});

// Delete entry
router.delete('/:collection/:slug', auth, async (req, res) => {
  const { collection, slug } = req.params;
  const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

  if (!await fs.pathExists(filePath)) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  try {
    await fs.remove(filePath);
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting entry', error: err.message });
  }
});

module.exports = router;
