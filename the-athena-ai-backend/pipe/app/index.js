const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('¡Hola desde Pedro Atenea!'));
app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
