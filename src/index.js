const express = require('express');

const app = express();
const port = 3333;
const currentDate = new Date(Date.now());

app.use(express.json());

app.get('/', (request, response) => response.json({ message: currentDate }));

app.listen(port, () => console.log(`-> Server running on port ${port}`));