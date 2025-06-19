// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const equipeForm = document.getElementById('equipeForm');
const jogadorForm = document.getElementById('jogadorForm');
const equipesList = document.getElementById('equipesList');
const jogadoresList = document.getElementById('jogadoresList');
const idEquipeSelect = document.getElementById('idEquipe');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
equipeForm.addEventListener('submit', handleEquipeSubmit);
jogadorForm.addEventListener('submit', handleJogadorSubmit);

// Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const login = document.getElementById('login').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch(`/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login, senha }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            loginSection.style.display = 'none';
            mainContent.style.display = 'block';
            loadEquipes();
            loadJogadores();
        } else {
            alert(data.msg);
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login. Tente novamente.');
    }
}

async function handleEquipeSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeEquipe').value;
    const nome_tecnico = document.getElementById('nomeTecnico').value;
    const telefone_tecnico = document.getElementById('telefoneTecnico').value;

    try {
        const response = await fetch(`/cadastrar/equipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, nome_tecnico, telefone_tecnico }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.msg);
            equipeForm.reset();
            loadEquipes();
        } else {
            alert(data.msg);
        }
    } catch (error) {
        console.error('Erro ao cadastrar equipe:', error);
        alert('Erro ao cadastrar equipe. Tente novamente.');
    }
}

async function handleJogadorSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeJogador').value;
    const camisa = document.getElementById('camisa').value;
    const nascimento = document.getElementById('nascimento').value;
    const altura = document.getElementById('altura').value;
    const genero = document.getElementById('genero').value;
    const posicao = document.getElementById('posicao').value;
    const id_equipe = document.getElementById('idEquipe').value;

    try {
        const response = await fetch(`/cadastrar/jogador`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                camisa,
                nascimento,
                altura,
                genero,
                posicao,
                id_equipe: parseInt(id_equipe)
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.msg);
            jogadorForm.reset();
            loadJogadores();
        } else {
            alert(data.msg);
        }
    } catch (error) {
        console.error('Erro ao cadastrar jogador:', error);
        alert('Erro ao cadastrar jogador. Tente novamente.');
    }
}

async function loadEquipes() {
    try {
        const response = await fetch(`/listar/equipes`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            const equipes = data.msg;
            
            // Update equipes list
            equipesList.innerHTML = equipes.map(equipe => `
                <div class="list-group-item">
                    <h5>${equipe.nome}</h5>
                    <p class="mb-1">Técnico: ${equipe.nome_tecnico}</p>
                    <p class="mb-1">Telefone: ${equipe.telefone}</p>
                    <small>Jogadores: ${equipe.quantidade_jogadores}/6</small>
                </div>
            `).join('');

            // Update equipe select for jogadores
            idEquipeSelect.innerHTML = equipes.map(equipe => `
                <option value="${equipe.id}">${equipe.nome}</option>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar equipes:', error);
    }
}

async function loadJogadores() {
    try {
        const [equipesResponse, jogadoresResponse] = await Promise.all([
            fetch(`/listar/equipes`, { credentials: 'include' }),
            fetch(`/listar/jogadores`, { credentials: 'include' })
        ]);

        const equipesData = await equipesResponse.json();
        const jogadoresData = await jogadoresResponse.json();

        if (equipesResponse.ok && jogadoresResponse.ok) {
            const equipes = equipesData.msg;
            const jogadores = jogadoresData.msg;

            // Agrupar jogadores por equipe
            const jogadoresPorEquipe = equipes.map(equipe => {
                const jogadoresDaEquipe = jogadores.filter(j => j.id_equipe === equipe.id);

                return {
                    equipeNome: equipe.nome,
                    jogadores: jogadoresDaEquipe
                };
            });

            // Renderizar no HTML
            jogadoresList.innerHTML = jogadoresPorEquipe.map(grupo => {
                return `
                    <div class="list-group-item">
                        <h4>${grupo.equipeNome}</h4>
                        ${grupo.jogadores.length === 0 ? '<p><i>Sem jogadores ainda</i></p>' : ''}
                        <ul>
                            ${grupo.jogadores.map(j => `
                                <li>
                                    <strong>${j.nome}</strong> (Camisa ${j.camisa}, ${j.posicao}, ${j.altura}cm, ${j.genero === 'M' ? 'Masculino' : 'Feminino'})
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
    }
}

async function logout() {
    try {
        const response = await fetch(`/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            mainContent.style.display = 'none';
            loginSection.style.display = 'block';
            loginForm.reset();
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

async function checkAuth() {
    try {
        const response = await fetch(`/listar/equipes`, {
            credentials: 'include'
        });

        if (response.ok) {
            loginSection.style.display = 'none';
            mainContent.style.display = 'block';
            loadEquipes();
            loadJogadores();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Check authentication on page load
checkAuth(); 