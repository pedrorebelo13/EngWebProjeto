const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ucModel = require('./models/ucModel');
const userModel = require('./models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const nomeBD = 'projetoEW';
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;

function loadJson(fileName) {
    const filePath = path.join(__dirname, 'data', fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadUsers() {
    const filePath = path.join(__dirname, 'data', 'users.json');
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.users)) {
        return data.users;
    }

    return [];
}

function isBcryptHash(value) {
    return typeof value === 'string' && value.startsWith('$2');
}

async function seedUsers(users) {
    const allowedRoles = new Set(['admin', 'docente', 'aluno']);
    let created = 0;

    for (const entry of users) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }

        const username = (entry.username || '').trim().toLowerCase();
        const name = (entry.name || '').trim();
        const email = (entry.email || '').trim().toLowerCase();
        const role = allowedRoles.has(entry.role) ? entry.role : 'aluno';
        const filiacao = (entry.filiacao || '').trim();
        const passwordValue = entry.password || entry.passwordHash;

        if (!username || !name || !email || !passwordValue) {
            console.warn(`Utilizador ignorado por falta de dados obrigatorios: ${username || email || 'desconhecido'}`);
            continue;
        }

        const existingUser = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            console.log(`Utilizador ${username} ja existe. Seed ignorado.`);
            continue;
        }

        const hashedPassword = isBcryptHash(passwordValue)
            ? passwordValue
            : await bcrypt.hash(String(passwordValue), 10);

        const apiKey = entry.apiKey
            ? String(entry.apiKey).trim()
            : crypto.randomBytes(24).toString('hex');

        const newUser = new userModel({
            username,
            name,
            email,
            filiacao,
            password: hashedPassword,
            role,
            apiKey
        });

        await newUser.save();
        created++;
    }

    console.log(`Seed de utilizadores terminado. Criados: ${created}.`);
}

function normalizeUc(rawUc) {
    const yearMatch = rawUc.sigla && rawUc.sigla.match(/(\d{4})$/);
    const aulas = Array.isArray(rawUc.aulas) ? rawUc.aulas : [];

    const normalizedAulas = aulas
        .map(aula => {
            const sumario = Array.isArray(aula.sumario)
                ? aula.sumario.map(entry => String(entry).trim()).filter(Boolean)
                : [];

            if (sumario.length === 0) {
                return null;
            }

            return {
                ...aula,
                sumario
            };
        })
        .filter(Boolean);

    const parseDate = (value, fallbackYear) => {
        if (!value || typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim();
        if (!trimmed || trimmed === '???') {
            return null;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const parsed = new Date(trimmed);
            return isNaN(parsed.getTime()) ? null : parsed;
        }

        const normalized = trimmed
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const monthMap = {
            janeiro: '01',
            fevereiro: '02',
            marco: '03',
            abril: '04',
            maio: '05',
            junho: '06',
            julho: '07',
            agosto: '08',
            setembro: '09',
            outubro: '10',
            novembro: '11',
            dezembro: '12'
        };

        const dayMatch = normalized.match(/(\d{1,2})\s+de\s+([a-z]+)/);
        if (dayMatch) {
            const day = dayMatch[1].padStart(2, '0');
            const month = monthMap[dayMatch[2]];
            const year = fallbackYear || new Date().getFullYear();
            if (month) {
                const parsed = new Date(`${year}-${month}-${day}`);
                return isNaN(parsed.getTime()) ? null : parsed;
            }
        }

        const weekMatch = normalized.match(/primeira\s+semana\s+de\s+([a-z]+)/);
        if (weekMatch) {
            const month = monthMap[weekMatch[1]];
            const year = fallbackYear || new Date().getFullYear();
            if (month) {
                const parsed = new Date(`${year}-${month}-01`);
                return isNaN(parsed.getTime()) ? null : parsed;
            }
        }

        return null;
    };

    const ucYear = rawUc.ano || (yearMatch ? Number(yearMatch[1]) : new Date().getFullYear());

    return {
        _id: rawUc.sigla,
        sigla: rawUc.sigla,
        titulo: rawUc.titulo,
        ano: ucYear,
        docentes: rawUc.docentes || [],
        horario: rawUc.horario || { teoricas: [], praticas: [] },
        avaliacao: rawUc.avaliacao || [],
        isPublic: true,
        datas: {
            teste: parseDate(rawUc.datas?.teste, ucYear),
            exame: parseDate(rawUc.datas?.exame, ucYear),
            projeto: parseDate(rawUc.datas?.projeto, ucYear)
        },
        aulas: normalizedAulas,
        website: {
            tipo: rawUc.website?.tipo || 'A',
            corPrincipal: rawUc.website?.corPrincipal || rawUc.website?.['cor principal'] || 'blue'
        }
    };
}

async function main() {
    await mongoose.connect(mongoHost);

    const users = loadUsers();
    if (users.length > 0) {
        await seedUsers(users);
    } else {
        const adminExists = await userModel.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            const adminUser = new userModel({
                username: 'admin',
                name: 'Administrador',
                email: 'admin@admin.com',
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log('Utilizador admin criado com sucesso.');
        } else {
            console.log('Utilizador admin ja existe.');
        }
    }

    const existingCount = await ucModel.countDocuments();
    if (existingCount > 0) {
        console.log(`Coleção ucs já contém ${existingCount} documentos. Seed ignorado.`);
        await mongoose.disconnect();
        return;
    }

    const files = ['metaATP2023.json', 'metaENGWEB2024.json', 'metaRPCW2024.json'];
    const ucs = files.map(fileName => normalizeUc(loadJson(fileName)));

    await ucModel.insertMany(ucs);

    console.log(`Inseridas ${ucs.length} UCs na coleção ucs.`);
    await mongoose.disconnect();
}

main().catch(async error => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});