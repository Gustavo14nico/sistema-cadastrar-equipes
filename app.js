const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require('path');

const app = express();
const PORT = 8080;

// Configuração de CORS
const corsOptions = {
    origin: ["http://localhost:3000", "https://sistema-cadastrar-equipes.vercel.app/"], 
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'page')));
app.set('trust proxy', 1); // Necessário para Vercel (HTTPS)

// Sessão
app.use(session({
    secret: 'token-do-assis-secreto-fipp',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,               // true para produção (https)
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 30      // 30 minutos
    }
}));

// Simulando tabelas
const equipes = [];
const jogadores = [];
const contas = [
    { login: "admin@gmail.com", senha: "senha123", last_access: null },
    { login: "test@example.com", senha: "password123", last_access: null }
];

// Rotas públicas
app.post("/login", (req, res) => {
    if (!required(req, ['login', 'senha'])) {
        return res.status(400).json({ msg: "Informações estão faltando!" });
    }

    try {
        const { login, senha } = req.body;
        const conta = contas.find(c => c.login === login);

        if (!conta) return res.status(404).json({ msg: "Conta não encontrada!" });
        if (conta.senha !== senha) return res.status(401).json({ msg: "Senha incorreta!" });

        req.session.user = { login: conta.login };

        const now = new Date().toISOString();
        conta.last_access = now;

        res.cookie('ultimoAcesso', now, { maxAge: 1000 * 60 * 60 * 24 }); // 24h

        return res.status(200).json({ msg: "Logado com sucesso!", last_access: now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Ocorreu um erro por parte do servidor!" });
    }
});

app.get("/check_login", (req, res) => {
    if (req.session.user) {
        const userEmail = req.session.user.login;
        const userAccount = contas.find(c => c.login === userEmail);
        const lastAccess = userAccount ? userAccount.last_access : null;
        return res.status(200).json({ msg: "Autenticado", last_access: lastAccess });
    }
    return res.status(401).json({ msg: "Não autenticado" });
});

// Cadastro de equipe
app.post("/cadastrar/equipe", autenticado, (req, res) => {
    if (!required(req, ['nome', 'nome_tecnico', 'telefone_tecnico'])) {
        return res.status(400).json({ msg: "Informações estão faltando!" });
    }

    try {
        const { nome, nome_tecnico, telefone_tecnico } = req.body;
        let id = equipes.length > 0 ? equipes[equipes.length - 1].id + 1 : 1;
        const nomeEquipe = equipes.find(e => e.nome === nome);

        if (nomeEquipe) return res.status(400).json({ msg: "Nome de equipe já cadastrada!" });

        const telefone = telefone_tecnico.replace(/\D/g, "");
        if (!validarTelefone(telefone)) return res.status(400).json({ msg: "Telefone no formato ou tamanho errado!" });

        equipes.push({
            id,
            nome,
            nome_tecnico,
            telefone,
            quantidade_jogadores: 0
        });

        res.status(201).json({ msg: "Equipe registrada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro no servidor!" });
    }
});

// Cadastro de jogador
app.post("/cadastrar/jogador", autenticado, (req, res) => {
    if (!required(req, ['nome', 'camisa', 'nascimento', 'altura', 'genero', 'posicao', 'id_equipe'])) {
        return res.status(400).json({ msg: "Informações estão faltando!" });
    }

    if (equipes.length === 0) return res.status(400).json({ msg: "Nenhuma equipe criada ainda!" });

    try {
        const { nome, camisa, nascimento, altura, genero, posicao, id_equipe } = req.body;
        let id = jogadores.length > 0 ? jogadores[jogadores.length - 1].id + 1 : 1;

        const camisaJogador = jogadores.find(j => j.camisa === camisa);
        if (camisaJogador) return res.status(400).json({ msg: "Camisa de jogador já cadastrada!" });

        const equipe = equipes.find(e => e.id === id_equipe);
        if (!equipe) return res.status(400).json({ msg: "Equipe não encontrada" });
        if (equipe.quantidade_jogadores >= 6) return res.status(400).json({ msg: "Limite de jogadores atingido!" });

        equipe.quantidade_jogadores++;

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
        res.status(500).json({ msg: "Erro no servidor!" });
    }
});

// Listagem
app.get("/listar/jogadores", autenticado, (req, res) => {
    try {
        return res.status(200).json({ msg: jogadores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar jogadores!" });
    }
});

app.get("/listar/equipes", autenticado, (req, res) => {
    try {
        return res.status(200).json({ msg: equipes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Erro ao listar equipes!" });
    }
});

// Logout
app.post("/logout", autenticado, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Erro ao destruir sessão:", err);
            return res.status(500).json({ msg: "Erro ao fazer logout." });
        }
        res.clearCookie('connect.sid');
        res.json({ msg: "Logout realizado com sucesso!" });
    });
});

// Middleware not found
app.use((req, res) => {
    res.status(404).json({ msg: "Rota não encontrada" });
});

// Middleware autenticado
function autenticado(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        return res.status(401).json({ msg: "Não autorizado, faça login!" });
    }
}

// Funções auxiliares
function required(request, campos) {
    return campos.every(campo => request.body && request.body[campo]);
}

function validarTelefone(telefone) {
    return telefone.length === 11;
}

// module.exports = app; // Para deploy (Vercel)
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
