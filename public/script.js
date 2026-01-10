// Variables globales
let currentOffset = 0;
let currentLimit = 20;
let allPokemon = [];
let currentFilter = '';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Aplicación iniciada');
    
    // Cargar tipos de Pokémon
    await loadTypes();
    
    // Cargar lista inicial de Pokémon
    await loadPokemonList();

    // Event listeners
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchPokemon();
    });
});

/**
 * Cargar lista de tipos de Pokémon en el filtro
 */
async function loadTypes() {
    try {
        const response = await fetch('/api/types');
        const data = await response.json();
        const typeSelect = document.getElementById('typeFilter');
        
        if (data.results) {
            data.results.forEach(type => {
                const option = document.createElement('option');
                option.value = type.name;
                option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
                typeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

/**
 * Cargar lista de Pokémon con paginación
 */
async function loadPokemonList() {
    try {
        showLoading();
        currentFilter = '';
        const response = await fetch(`/api/pokemon?limit=${currentLimit}&offset=${currentOffset}`);
        const data = await response.json();
        
        allPokemon = data.results || [];
        
        // Ocultar detalles si estaban mostrados
        document.getElementById('detailsContainer').innerHTML = '';
        document.getElementById('detailsContainer').classList.add('hidden');
        
        await displayPokemonGrid(allPokemon);
        updatePaginationInfo();
    } catch (error) {
        console.error('Error cargando Pokémon:', error);
        showError('Error al cargar los Pokémon');
    }
}

/**
 * Buscar Pokémon por nombre
 */
async function searchPokemon() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (!searchTerm) {
        alert('Por favor ingresa un nombre de Pokémon');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`/api/pokemon-search/${searchTerm}`);
        
        if (!response.ok) {
            showError(`Pokémon "${searchTerm}" no encontrado`);
            return;
        }

        const data = await response.json();
        
        // Limpiar grid y mostrar detalles del Pokémon
        document.getElementById('pokemonGrid').innerHTML = '';
        document.getElementById('paginationContainer').classList.add('hidden');
        
        displayPokemonDetails(data);
    } catch (error) {
        console.error('Error buscando Pokémon:', error);
        showError('Error al buscar Pokémon');
    }
}

/**
 * Filtrar Pokémon por tipo
 */
async function filterByType() {
    const typeName = document.getElementById('typeFilter').value;
    
    if (!typeName) {
        loadPokemonList();
        return;
    }

    try {
        showLoading();
        const response = await fetch(`/api/type/${typeName}`);
        const data = await response.json();
        
        if (data.pokemon) {
            // Obtener solo los primeros 40 pokémon del tipo
            const pokemonList = data.pokemon.slice(0, 40).map(p => ({
                name: p.pokemon.name,
                url: p.pokemon.url
            }));
            
            allPokemon = pokemonList;
            currentFilter = typeName;
            currentOffset = 0;
            document.getElementById('paginationContainer').classList.add('hidden');
            
            await displayPokemonGrid(allPokemon);
        }
    } catch (error) {
        console.error('Error filtrando por tipo:', error);
        showError('Error al filtrar por tipo');
    }
}

/**
 * Cambiar límite de Pokémon por página
 */
function changeLimit() {
    currentLimit = parseInt(document.getElementById('limitSelect').value);
    currentOffset = 0;
    loadPokemonList();
}

/**
 * Mostrar grid de Pokémon
 */
async function displayPokemonGrid(pokemonList) {
    const pokemonGrid = document.getElementById('pokemonGrid');
    pokemonGrid.innerHTML = '';

    // Mostrar loading mientras se cargan los detalles
    const promises = pokemonList.map(pokemon => 
        fetch(`/api/pokemon/${pokemon.name}`)
            .then(res => res.json())
            .catch(err => {
                console.error(`Error cargando ${pokemon.name}:`, err);
                return null;
            })
    );

    const pokemonDetails = await Promise.all(promises);

    pokemonDetails.forEach(pokemon => {
        if (!pokemon) return;
        
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });
}

/**
 * Crear tarjeta de Pokémon
 */
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card bg-white rounded-lg shadow-md overflow-hidden fade-in';
    card.style.cursor = 'pointer';

    const types = pokemon.types.map(t => t.type.name).join(', ');
    const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;

    card.innerHTML = `
        <div class="bg-gradient-to-r from-red-400 to-orange-300 p-4">
            <img src="${image}" alt="${pokemon.name}" class="w-full h-48 object-contain">
        </div>
        <div class="p-4">
            <h3 class="text-lg font-bold text-gray-800 capitalize mb-2">${pokemon.name}</h3>
            <p class="text-sm text-gray-600 mb-3">ID: #${pokemon.id}</p>
            <div class="mb-3">
                ${pokemon.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('')}
            </div>
            <div class="text-sm text-gray-700">
                <p class="mb-1"><strong>Altura:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
                <p><strong>Peso:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        document.getElementById('paginationContainer').classList.add('hidden');
        displayPokemonDetails(pokemon);
    });

    return card;
}

/**
 * Mostrar detalles completos de un Pokémon
 */
async function displayPokemonDetails(pokemon) {
    const detailsContainer = document.getElementById('detailsContainer');
    
    const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
    const habilidades = pokemon.abilities.map(a => a.ability.name).join(', ');
    
    const statsHTML = pokemon.stats.map(stat => `
        <div class="mb-3">
            <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700 capitalize">${stat.stat.name}</span>
                <span class="text-sm font-bold text-gray-800">${stat.base_stat}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="stat-bar" style="width: ${(stat.base_stat / 150) * 100}%"></div>
            </div>
        </div>
    `).join('');

    const movimientos = pokemon.moves.slice(0, 8).map(m => m.move.name).join(', ');

    detailsContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <button 
                onclick="loadPokemonList()" 
                class="mb-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
            >
                ← Volver a la lista
            </button>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Imagen y info básica -->
                <div class="md:col-span-1">
                    <div class="bg-gradient-to-b from-red-400 to-orange-300 rounded-lg p-6 mb-6">
                        <img src="${image}" alt="${pokemon.name}" class="w-full h-auto">
                    </div>
                    <div class="bg-gray-100 rounded-lg p-4">
                        <h2 class="text-3xl font-bold text-gray-800 capitalize mb-2">${pokemon.name}</h2>
                        <p class="text-xl text-gray-600 mb-4">ID: #${pokemon.id}</p>
                        <div class="mb-4">
                            ${pokemon.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Estadísticas y información -->
                <div class="md:col-span-2">
                    <!-- Información física -->
                    <div class="bg-blue-50 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">📏 Información Física</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-gray-600 text-sm">Altura</p>
                                <p class="text-2xl font-bold text-blue-600">${(pokemon.height / 10).toFixed(1)} m</p>
                            </div>
                            <div>
                                <p class="text-gray-600 text-sm">Peso</p>
                                <p class="text-2xl font-bold text-blue-600">${(pokemon.weight / 10).toFixed(1)} kg</p>
                            </div>
                        </div>
                    </div>

                    <!-- Estadísticas de batalla -->
                    <div class="bg-green-50 rounded-lg p-6 mb-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">⚔️ Estadísticas de Batalla</h3>
                        ${statsHTML}
                    </div>

                    <!-- Habilidades -->
                    <div class="bg-purple-50 rounded-lg p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🎯 Habilidades</h3>
                        <p class="text-gray-700 capitalize">${habilidades}</p>
                    </div>
                </div>
            </div>

            <!-- Movimientos -->
            <div class="bg-yellow-50 rounded-lg p-6 mt-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3">💥 Movimientos (primeros 8)</h3>
                <p class="text-gray-700 capitalize text-sm leading-relaxed">${movimientos}</p>
            </div>
        </div>
    `;

    detailsContainer.classList.remove('hidden');
    document.getElementById('pokemonGrid').innerHTML = '';
}

/**
 * Siguiente página
 */
function nextPage() {
    currentOffset += currentLimit;
    loadPokemonList();
}

/**
 * Página anterior
 */
function previousPage() {
    if (currentOffset > 0) {
        currentOffset -= currentLimit;
        loadPokemonList();
    }
}

/**
 * Actualizar información de paginación
 */
function updatePaginationInfo() {
    const pageNumber = Math.floor(currentOffset / currentLimit) + 1;
    document.getElementById('pageInfo').textContent = `Página ${pageNumber}`;
    
    document.getElementById('prevBtn').disabled = currentOffset === 0;
    
    if (currentFilter) {
        document.getElementById('paginationContainer').classList.add('hidden');
    }
}

/**
 * Mostrar indicador de carga
 */
function showLoading() {
    const grid = document.getElementById('pokemonGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block"><span class="loading"></span><span class="loading"></span><span class="loading"></span></div><p class="text-gray-600 mt-4">Cargando Pokémon...</p></div>';
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    const grid = document.getElementById('pokemonGrid');
    grid.innerHTML = `
        <div class="col-span-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p class="text-red-600 text-lg font-semibold">❌ ${message}</p>
            <button 
                onclick="loadPokemonList()"
                class="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition"
            >
                Intentar de nuevo
            </button>
        </div>
    `;
}
