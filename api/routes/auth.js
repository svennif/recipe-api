import express from 'express';
import { getUsersDb } from '../utils/db.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
      await logger.warn('Invalid registration request - missing required fields', {
        hasBody: !!req.body,
        fields: req.body ? Object.keys(req.body) : []
      });
      return res.status(400).json({
        message: 'Missing required fields: name, email, and password are required'
      });
    }
    const authDb = getUsersDb();
    const usersCollection = authDb.collection('users');

    const existingUser = await usersCollection.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already connected to an existing user' });
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await usersCollection.insertOne({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    });

    await logger.info('User registered successfully', {
      insertedId: newUser.insertedId,
    });

    res.status(201).json({
      message: 'User registered successfully',
      insertedId: newUser.insertedId,
      email: req.body.email
    });
  } catch (err) {
    await logger.error('Failed to register user', {
      error: err.message,
      stack: err.stack,
      email: req.body.email
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      await logger.warn('Invalid login request - missing required fields', {
        hasBody: !!req.body,
        fields: req.body ? Object.keys(req.body) : []
      });
      return res.status(400).json({
        message: 'Missing required fields: email and password are required'
      });
    }
    const authDb = getUsersDb();
    const usersCollection = authDb.collection('users');
    const user = await usersCollection.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).send({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    await logger.error('Failed to log in', {
      error: err.message,
      stack: err.stack,
      email: req.body?.email
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;