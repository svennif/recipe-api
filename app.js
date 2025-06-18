import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log("Server is listening on PORT:", PORT);
});

app.get("/status", (req, res) => {
  const status = {
    "Status": "Running"
  };
  res.send(status);
});

