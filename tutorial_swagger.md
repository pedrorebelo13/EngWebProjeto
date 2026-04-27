# Tutorial Swagger (Fase 1 e 2)

Este guia mostra como testar a configuracao base do Swagger (UI + definicao OpenAPI) depois de clonar o repositorio.

## 1) Entrar na pasta do projeto

No Windows (PowerShell ou CMD):
- `cd C:\Users\userdsi\Desktop\EngWebProjeto`

No WSL (recomendado para evitar problemas de permissao):
- `cd ~/EW/EngWebProjeto`

## 2) Instalar dependencias

Corre uma vez por maquina:
- `npm install`

Isto instala as dependencias do projeto, incluindo `swagger-ui-express` e `swagger-jsdoc`.

## 3) Arrancar a aplicacao

- `npm start`

A aplicacao fica disponivel em:
- `http://localhost:16000`

## 4) Abrir a interface Swagger

Depois de iniciar a app, abre:
- `http://localhost:16000/api-docs`

Se a pagina abrir, a fase 1 e 2 esta OK. Nesta fase ainda nao existem endpoints documentados; isso fica para a fase 3.

## 5) Problemas comuns

- Se `npm install` falhar, confirma que tens o Node.js instalado.
- Se `npm start` falhar por causa do MongoDB, inicia o Mongo localmente ou ajusta `MONGO_URL`.
- Se a pagina `/api-docs` nao aparecer, confirma se o servidor esta realmente a correr em `16000`.
