import express from 'express';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const getRepertorio = async () => {
  try {
    const fsResponse = await readFile('repertorio.json', 'utf-8');
    const repertorio = JSON.parse(fsResponse);
    console.log('Lectura de repertorio.json exitosa.');
    return repertorio;
  } catch (error) {
    console.log('Error al leer el archivo repertorio.json.', error.message);
    if (error.code === 'ENOENT') {
      const newRepertorio = [];
      await writeFile('repertorio.json', JSON.stringify(newRepertorio));
      console.log('Se creó un nuevo archivo repertorio.json.');
      return newRepertorio;
    }
  }
};

const saveRepertorio = async (repertorio) => {
  try {
    await writeFile('repertorio.json', JSON.stringify(repertorio));
    console.log('Escritura de repertorio.json exitosa.');
  } catch (error) {
    console.log('Error al escribir en el archivo repertorio.json.', error.message);
  }
};

// GET /index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /canciones
app.get('/canciones', async (req, res) => {
  const repertorio = await getRepertorio();
  res.json(repertorio);
});

// POST /canciones
app.post('/canciones', async (req, res) => {
  const { id, titulo, artista, tono } = req.body;
  const newCancion = { id, titulo, artista, tono };

  if ( !newCancion.titulo || !newCancion.artista || !newCancion.tono ) {
    return res.status(401).json({
      message: 'La canción no fue agregada por tener campos vacíos o incompletos.',
    });
  }

  const repertorio = await getRepertorio();
  const idExistente = repertorio.some((cancion) => cancion.id === newCancion.id);

  if (idExistente) {
    return res.status(401).json({
      message: 'La canción no fue agregada, el id ya existe.',
    });
  }

  repertorio.push(newCancion);
  await saveRepertorio(repertorio);

  res.status(201).json({
    message: 'La canción fue agregada exitosamente.',
    cancionAgregada: newCancion,
  });
});

// PUT /canciones/:id
app.put('/canciones/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, artista, tono } = req.body;

  if (!titulo || !artista || !tono ) {
    return res.status(401).json({
      message: 'La canción no puede tener campos vacíos o incompletos.',
    });
  }

  const repertorio = await getRepertorio();
  const index = repertorio.findIndex((cancion) => cancion.id === id);

  if (index !== -1) {
    repertorio[index] = { id, titulo, artista, tono };
    await saveRepertorio(repertorio);
    res.json({
      message: 'La canción fue actualizada exitosamente.',
    });
  } else {
    res.status(401).json({
      message: 'No se encuentra el id de la canción.',
    });
  }
});

// DELETE /canciones/:id
app.delete('/canciones/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const repertorio = await getRepertorio();
  const newRepertorio = repertorio.filter((cancion) => cancion.id != id);

  if (repertorio.length != newRepertorio.length) {
    await saveRepertorio(newRepertorio);
    res.json({
      message: 'La canción fue eliminada exitosamente',
    });
  } else {
    res.status(401).json({
      message: 'No se encuentra el id de la canción.',
    });
  }
});

app.use((req, res) => {
  res.status(404).send('404 página no encontrada');
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});