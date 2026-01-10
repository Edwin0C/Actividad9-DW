const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// URL base de PokeAPI
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Ruta para obtener la lista de Pokémon
app.get('/api/pokemon', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const response = await axios.get(`${POKEAPI_BASE}/pokemon`, {
      params: { limit, offset }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener lista de Pokémon:', error.message);
    res.status(500).json({ error: 'Error al obtener Pokémon' });
  }
});

// Ruta para obtener detalles de un Pokémon específico
app.get('/api/pokemon/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${POKEAPI_BASE}/pokemon/${id.toLowerCase()}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener detalles del Pokémon:', error.message);
    res.status(404).json({ error: 'Pokémon no encontrado' });
  }
});

// Ruta para buscar Pokémon por nombre
app.get('/api/pokemon-search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(`${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error en la búsqueda:', error.message);
    res.status(404).json({ error: 'Pokémon no encontrado' });
  }
});

// Ruta para obtener tipos de Pokémon
app.get('/api/types', async (req, res) => {
  try {
    const response = await axios.get(`${POKEAPI_BASE}/type`);
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener tipos:', error.message);
    res.status(500).json({ error: 'Error al obtener tipos' });
  }
});

// Ruta para obtener Pokémon por tipo
app.get('/api/type/:typeName', async (req, res) => {
  try {
    const { typeName } = req.params;
    const response = await axios.get(`${POKEAPI_BASE}/type/${typeName.toLowerCase()}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener Pokémon por tipo:', error.message);
    res.status(404).json({ error: 'Tipo no encontrado' });
  }
});

// Ruta para obtener habilidades
app.get('/api/abilities', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const response = await axios.get(`${POKEAPI_BASE}/ability`, {
      params: { limit, offset }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener habilidades:', error.message);
    res.status(500).json({ error: 'Error al obtener habilidades' });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Interfaz disponible en http://localhost:${PORT}`);
});
