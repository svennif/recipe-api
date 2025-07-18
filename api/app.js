import express from "express";
import { run } from './utils/db.js';
import recipeRoutes from './routes/index.js';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await run();
      dbInitialized = true;
      console.log('Database initialized');
    } catch (err) {
      console.error('Failed to initialize database:', err);
      throw err;
    }
  }
}

app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api', recipeRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("Server is listening on PORT:", PORT);
  });
}

export default app;