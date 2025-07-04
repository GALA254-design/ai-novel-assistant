const { User } = require('../models');
const admin = require('firebase-admin');

// Add Firebase Admin SDK initialization
try {
  admin.app(); // will throw if not initialized
} catch (e) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const firestore = admin.firestore();

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Set by JWT middleware
    const { name, email, bio, avatar } = req.body;

    // Input validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (name && name.length < 2) {
      return res.status(400).json({ message: 'Name too short.' });
    }

    // Update user in SQL DB as before
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.bio = bio ?? user.bio;
    user.avatar = avatar ?? user.avatar;
    await user.save();

    // Update user in Firebase Auth and Firestore
    // Assume req.user.firebaseUid is set by auth middleware if user is from Firebase
    if (req.user.firebaseUid) {
      // Update Firebase Auth
      await admin.auth().updateUser(req.user.firebaseUid, {
        displayName: name,
        email: email,
        photoURL: avatar,
      });
      // Update Firestore profile
      await firestore.collection('users').doc(req.user.firebaseUid).set({
        name,
        email,
        bio,
        avatar,
      }, { merge: true });
    }

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        name: name ?? user.name,
        email: email ?? user.email,
        bio: bio ?? user.bio,
        avatar: avatar ?? user.avatar,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'bio', 'avatar']
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};