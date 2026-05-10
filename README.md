# EngWebProjeto

| Nome            | Nº de aluno |
| --------------- | ----------- |
| Vasco Gonçalves | A104527     |
| Pedro Rebelo    | A104091     |
| Gonçalo Freitas | A104350     |

Aplicação web (Node.js + Express + MongoDB) para gerir UCs: docentes, horários, aulas, calendário de avaliação e _website_ da disciplina. Suporta autenticação por _cookie_ (JWT) e por API key, com três papéis: `admin`, `docente`, `aluno`.

---

## Funcionalidades

- Registo e login com JWT em cookie; suporte a API key para consumo programático.
- Perfis `admin`, `docente` e `aluno` com permissões distintas.
- Aprovação de contas docentes pelo administrador (contas docentes ficam pendentes até aprovação).
- Gestão de UCs: criar, editar e apagar (admin e docente criador); visibilidade pública/privada.
- Listagem de UCs com pesquisa, filtro por ano e ordenação.
- Detalhe da UC com layouts configuráveis (website tipo A/B/C).
- Importação e exportação de dados (docentes, aulas e UC completa) em JSON.
- Gestão de utilizadores pelo administrador: listar, editar, aprovar docentes, alterar role, apagar.
- Documentação da API via Swagger UI em `/api-docs`.

## Arranque rápido (Docker)

1. Construir e arrancar tudo (recomendado):

```bash
cd EngWebProjeto
docker compose up --build
```

O `docker-compose.yml` inicia três serviços em sequência:

- **mongo** — base de dados (com _healthcheck_)
- **seed** — popula a BD com utilizadores de teste e três UCs (corre uma vez e termina)
- **app** — servidor Express, só arranca depois de o _seed_ terminar

2. Endpoints principais após arranque:

- Interface (Pug): http://localhost:16000
- Login: http://localhost:16000/auth/login
- Lista de UCs: http://localhost:16000/uc/ucs
- MongoDB (bind host): `27017`

3. Utilizadores de teste (criados pelo _seed_ a partir de `data/users.json`):

| Username  | Password  | Role    |
| --------- | --------- | ------- |
| `admin`   | `admin`   | admin   |
| `docente` | `docente` | docente |
| `aluno`   | `aluno`   | aluno   |

## Variáveis de ambiente

Configuradas em `docker-compose.yml` ou via _shell_ em modo local:

- `MONGO_URL` — URL de ligação ao MongoDB (default: `mongodb://127.0.0.1:27017/projetoEW`)
- `PORT` — porta do servidor (default: `16000`)
- `JWT_SECRET` — segredo para assinar e validar JWTs (default em dev: `2026-04-13`)
- `JWT_EXPIRES_IN` — tempo de vida do token (default: `1h`)

---

## Endpoints principais

**Auth**

- `GET  /auth/login` · `GET /auth/register` — formulários
- `POST /auth/login` · `POST /auth/register` · `POST /auth/logout`

**UCs**

- `GET  /uc/ucs` — listar (com `?search=`, `?ano=`, `?sort=`, `?order=`)
- `GET  /uc/ucs/new` — formulário de criação (admin/docente)
- `POST /uc/ucs` — criar
- `GET  /uc/ucs/:id` — detalhe
- `GET  /uc/ucs/:id/edit` · `PUT|POST /uc/ucs/:id` · `DELETE /uc/ucs/:id`
- `GET  /uc/ucs/:id/export/{docentes|aulas|full}` — exportação JSON
- `POST /uc/ucs/:id/import/{aulas|full}` — importação JSON (`multipart/form-data`, campo `file`)

**Utilizadores (admin)**

- `GET    /users/list`
- `GET    /users/:id/edit` · `POST /users/:id` · `DELETE /users/:id`

**Swagger**

- `GET /api-docs` — documentação interativa (Swagger UI)

---

## Autenticação

Dois modos suportados em qualquer rota protegida:

1. **Cookie** (browser) — `token` JWT `HttpOnly`, definido no login.
2. **API key** (cliente programático) — _header_ `x-api-key: <chave>` (gerada no registo).

Para forçar resposta em JSON em vez de HTML, enviar `Accept: application/json`.

```bash
# login via API
curl -X POST http://localhost:16000/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"identifier":"admin","password":"admin"}'

# listar UCs com API key
curl http://localhost:16000/uc/ucs \
  -H "x-api-key: <chave>" \
  -H "Accept: application/json"
```

---

## Verificações rápidas (smoke checks)

```bash
# 1. Servidor a responder (deve redirecionar para /auth/login)
curl -i http://localhost:16000/

# 2. Página de login
curl http://localhost:16000/auth/login | head

# 3. Login JSON e captura do token
curl -X POST http://localhost:16000/auth/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"identifier":"admin","password":"admin"}'
```

---

## Promover utilizador a admin

```bash
node makeAdmin.js <username-ou-email>           # promove a admin
node makeAdmin.js <username-ou-email> --role=docente
```
