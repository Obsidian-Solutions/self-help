const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { auth } = require('../middleware/auth');

const MEDIA_DIR = path.join(__dirname, '../../static/images');
const ILLUSTRATION_DIR = path.join(__dirname, '../../assets/illustrations/library');

// List media files
router.get('/', auth, async (req, res) => {
  try {
    await fs.ensureDir(MEDIA_DIR);
    const files = await fs.readdir(MEDIA_DIR);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f));
    res.json(images.map(f => ({ name: f, url: `/images/${f}` })));
  } catch (err) {
    res.status(500).json({ message: 'Error reading media directory' });
  }
});

// Intelligent Illustration Proxy (Finds file by prefix since unDraw adds unique suffixes)
router.get('/illustrations/:name', async (req, res) => {
  try {
    const name = req.params.name.replace('.svg', '');
    const files = await fs.readdir(ILLUSTRATION_DIR);
    // Find file that starts with the name (e.g., "breathing" -> "undraw_breathing_...")
    // or exact match
    const match = files.find(f => f === `${name}.svg` || f === `undraw_${name}.svg` || f.startsWith(`undraw_${name}_`) || f.startsWith(`${name}_`));
    
    if (match) {
      res.sendFile(path.join(ILLUSTRATION_DIR, match));
    } else {
      res.status(404).json({ message: 'Illustration not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// Upload media
router.post('/upload', auth, async (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ message: 'Missing file data' });

  try {
    const filePath = path.join(MEDIA_DIR, name);
    const base64Data = data.split(';base64,').pop();
    await fs.writeFile(filePath, base64Data, { encoding: 'base64' });
    res.json({ message: 'File uploaded successfully', url: `/images/${name}` });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Delete media
router.delete('/:name', auth, async (req, res) => {
  try {
    const filePath = path.join(MEDIA_DIR, req.params.name);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({ message: 'File deleted' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;