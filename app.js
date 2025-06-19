const express = require("express");
// const cors = require("cors"); // Cors para liberar o acesso
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require('path');

const app = express();
const PORT = 8080;
// const corsOptions = {
//   origin: "http://127.0.0.1:3000", 
//   credentials: true
// };

// app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'page')));

app.use(session({
    secret: 'token-do-assis-secreto-fipp', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,               
        httpOnly: true,
        sameSite: 'lax', 
        maxAge: 1000 * 60 * 30 
    }
}));

// Simulando tabelas de um banco de dados
const equipes  = [];
const jogadores = [];
const contas = [{login: "admin@gmail.com", senha: "senha123"}];

// Rotas pública
app.post("/login", (req, res) => {
    if(!required(req, ['login', 'senha'])){
        return res.status(400).json({ msg: "Informações estão faltando!" })
    }

    try {
        const { login, senha } = req.body;

        const conta = contas.find(c => c.login === login);

        if (!conta) {
            return res.status(404).json({ msg: "Conta não encontrada!" });
        }

        if (conta.senha !== senha) {
            return res.status(401).json({ msg: "Senha incorreta!" });
        }

        req.session.user = { login: conta.login };

        res.cookie('ultimoAcesso', new Date().toISOString(), { maxAge: 1000 * 60 * 60 * 24 });

        return res.status(200).json({ msg: "Logado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

// Rotas privada
// Cadastros 
app.post("/cadastrar/equipe", autenticado, (req, res) => {
    if(!required(req, ['nome', 'nome_tecnico', 'telefone_tecnico'])) {
        res.status(400).json({ msg: "Informações estão faltando!" })
    }

    try {
        const { nome, nome_tecnico, telefone_tecnico } = req.body;
        let id = 1; // Auto increment
        let quantidade_jogadores = 0;

        if(!equipes.length <= 0) {
            id += equipes[equipes.length-1].id;
        }

        // Validar nome de equipe
        const nomeEquipe = equipes.find(e => e.nome === nome);

        if (nomeEquipe) {
            return res.status(400).json({ msg: "Nome de equipe já cadastrada!" });
        }

        telefone = telefone_tecnico.replace(/\D/g, "");

        if(!validarTelefone(telefone)) return res.status(400).json({ msg: "Telefone no formato ou tamanho errado!" });
        
        equipes.push({
            id,
            nome,
            nome_tecnico,
            telefone,
            quantidade_jogadores
        });

        res.status(201).json({ msg: "Equipe registrada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

app.post("/cadastrar/jogador", autenticado, (req, res) => {
    if(!required(req, ['nome', 'camisa', 'nascimento', 'altura', 'genero', 'posicao', 'id_equipe'])) {
        res.status(400).json({ msg: "Informações estão faltando!" })
    }

    if(equipes.length <= 0) return res.status(400).json({ msg: "Nenhuma equipe criada ainda!" });

    try {
        const { nome, camisa, nascimento, altura, genero, posicao, id_equipe } = req.body;

        let id = 1; // Auto increment

        if(!jogadores.length <= 0) {
            id += jogadores[jogadores.length-1].id;
        }    
        
        // Validar nome de equipe
        const camisaJogador = jogadores.find(j => j.camisa === camisa);

        if (camisaJogador) {
            return res.status(400).json({ msg: "Camisa de jogador já cadastrada!" });
        }

        const equipe = equipes.find(e => e.id === id_equipe);

        if (!equipe) {
            return res.status(400).json({ msg: "Equipe não encontrada" });
        }

        if (equipe.quantidade_jogadores >= 6) {
            return res.status(400).json({ msg: "Quantidade máxima de jogadores atingida!" });
        }

        equipe.quantidade_jogadores = 1 + equipe.quantidade_jogadores;

        jogadores.push({
            id,
            nome,
            camisa,
            nascimento,
            altura,
            genero,
            posicao,
            id_equipe
        });

        res.status(201).json({ msg: "Jogador registrado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

// Listagem 
app.get("/listar/jogadores", autenticado, (req, res) => {
    try {
        return res.status(200).json({ msg: jogadores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

app.get("/listar/equipes", autenticado, (req, res) => {
    try {
        return res.status(200).json({ msg: equipes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

// Rota sair
app.post("/logout", autenticado, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ msg: "Logout realizado com sucesso!" });
    });
});

// Middleware Not Found
app.use((req, res) => {
    res.status(404).json({ msg: "Rota não encontrada" });
});

// Middleware para verificar sessão
function autenticado(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        return res.status(401).json({ msg: "Não autorizado, faça login!" });
    }
}

// Utilitários
function required(request, camposNecessarios) {
    if (!request.body) return false;
    if (camposNecessarios.some(campo => !request.body[campo])) 
        return false;

    return true;
}

function validarTelefone(telefone) {
    return telefone.length != 11 ? false : true;
}

// app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

module.exports = app; // Vercel