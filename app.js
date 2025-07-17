import express from "express";
import { run } from './db/connect.js';
import recipeRoutes from './routes/index.js';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function startServer() {
  try {
    await run();

    app.use('/api', recipeRoutes);

    app.get('/status', (req, res) => {
      const status = {
        "Status": "Running"
      }
      res.send(status);
    });

    app.listen(PORT, () => {
      console.log("Server is listening on PORT:", PORT);
    });

  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();