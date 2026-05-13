require('dotenv').config();

const express = require('express');

const logger = require('./middleware/logger');

const app = express();

app.use(express.json());
app.use(logger);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
