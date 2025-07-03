const path = require('path');
const fs = require('fs');
const { File, User, Story } = require('../models');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// POST /api/files/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const { userId, storyId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }
    // Check user exists
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    // If storyId provided, check story exists
    let story = null;
    if (storyId) {
      story = await Story.findByPk(storyId);
      if (!story) return res.status(404).json({ error: 'Story not found.' });
    }
    // Save file metadata in DB
    const fileRecord = await File.create({
      userId,
      storyId: storyId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
    });
    res.status(201).json(fileRecord);
  } catch (err) {
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
};

// GET /api/files/:filename
exports.downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const fileRecord = await File.findOne({ where: { filename } });
    if (!fileRecord) return res.status(404).json({ error: 'File not found.' });
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing on server.' });
    }
    res.download(filePath, fileRecord.originalName);
  } catch (err) {
    res.status(500).json({ error: 'File download failed', details: err.message });
  }
};

// GET /api/files/user/:userId
exports.listFilesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const files = await File.findAll({
      where: { userId },
      order: [['uploadDate', 'DESC']],
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files for user', details: err.message });
  }
};

// GET /api/files/story/:storyId
exports.listFilesByStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const files = await File.findAll({
      where: { storyId },
      order: [['uploadDate', 'DESC']],
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files for story', details: err.message });
  }
};

// Extract text from uploaded PDF or DOCX
exports.extractPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === '.docx') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'File extraction failed', details: err.message });
  }
}; 