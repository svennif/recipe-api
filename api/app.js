import express from "express";
import { run } from './utils/db.js';
import recipeRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';
import { limiter, strictLimiter } from "./middleware/rateLimit.js";
import { logger } from './utils/logger.js'
import morgan from 'morgan';
import { verifyToken } from "./middleware/authMiddleware.js";

const app = express();

if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const morganStream = {
  write: (message) => {
    logger.info(message.trim(), { type: 'http_request' });
  }
};

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: morganStream }));
} else {
  app.use(morgan('dev', { stream: morganStream }));
}

app.use(express.json());
app.use(limiter);

let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await run();
      dbInitialized = true;
    } catch (err) {
      await logger.error('Failed to initialize database', { error: err.message, stack: err.stack });
      throw err;
    }
  }
}

app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    await logger.error('Database connection failed', {
      error: err.message,
      path: req.path,
      method: req.method
    });
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/recipes/add', verifyToken, strictLimiter);
app.use('/api/v1/recipe/:id', (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    return verifyToken(req, res, () => strictLimiter(req, res, next));
  }
  next();
});

app.use('/api/v1/', recipeRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    await logger.info(`Server is listening on PORT: ${PORT}`);
  });
}

export default app;