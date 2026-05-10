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

function splitHorarioEntries(value) {
    if (value === undefined || value === null) {
        return [];
    }

    const raw = String(value).trim();
    if (!raw) {
        return [];
    }

    const parts = raw.split(/(?=Turno\s*\d+\s*:)/i).map(part => part.trim()).filter(Boolean);
    if (parts.length > 1) {
        return parts;
    }

    return [raw];
}

function normalizeHorarioRaw(value) {
    const horario = value || {};
    const toArray = (input) => {
        if (input === undefined || input === null) {
            return [];
        }
        return Array.isArray(input) ? input : [input];
    };

    const teoricas = toArray(horario.teoricas)
        .flatMap(entry => splitHorarioEntries(entry))
        .map(entry => String(entry).trim())
        .filter(Boolean);

    const praticas = toArray(horario.praticas)
        .flatMap(entry => splitHorarioEntries(entry))
        .map(entry => String(entry).trim())
        .filter(Boolean);

    return { teoricas, praticas };
}

function normalizeTime(hour, minute) {
    if (!hour) {
        return '';
    }
    const h = String(hour).padStart(2, '0');
    const m = String(minute || '00').padStart(2, '0');
    return `${h}:${m}`;
}

function parseHorarioEntry(value) {
    if (!value) {
        return null;
    }

    const raw = String(value).trim();
    if (!raw) {
        return null;
    }

    const lower = raw.toLowerCase();
    const turnoMatch = raw.match(/turno\s*\d+/i);
    const turno = turnoMatch ? turnoMatch[0].trim() : '';

    const dayMap = [
        { regex: /segunda|seg\b|2a/, label: 'Segunda-Feira' },
        { regex: /terca|terça|ter\b|3a/, label: 'Terca-Feira' },
        { regex: /quarta|qua\b|4a/, label: 'Quarta-Feira' },
        { regex: /quinta|qui\b|5a/, label: 'Quinta-Feira' },
        { regex: /sexta|sex\b|6a/, label: 'Sexta-Feira' },
        { regex: /sabado|sábado|sab\b/, label: 'Sabado' },
        { regex: /domingo|dom\b/, label: 'Domingo' }
    ];

    let dia = '';
    for (const entry of dayMap) {
        if (entry.regex.test(lower)) {
            dia = entry.label;
            break;
        }
    }

    const timeRegex = /(\d{1,2})(?:h|:)(\d{2})?/gi;
    const times = [];
    let match;
    while ((match = timeRegex.exec(lower)) !== null) {
        times.push(normalizeTime(match[1], match[2]));
    }

    const inicio = times[0] || '';
    const fim = times[1] || '';

    let sala = '';
    const salaIndex = lower.indexOf('sala');
    if (salaIndex >= 0) {
        sala = raw.slice(salaIndex + 4).replace(/^[\s:\-–,]+/, '').trim();
    } else if (raw.includes(',')) {
        const parts = raw.split(',');
        sala = parts[parts.length - 1].trim();
    }

    if (sala) {
        sala = sala.replace(/[.,;]+$/g, '').trim();
    }

    const normalized = { raw };
    if (turno) normalized.turno = turno;
    if (dia) normalized.dia = dia;
    if (inicio) normalized.inicio = inicio;
    if (fim) normalized.fim = fim;
    if (sala) normalized.sala = sala;

    return normalized;
}

function buildHorarioNorm(horario) {
    if (!horario) {
        return undefined;
    }

    const teoricas = (horario.teoricas || []).map(parseHorarioEntry).filter(Boolean);
    const praticas = (horario.praticas || []).map(parseHorarioEntry).filter(Boolean);

    if (!teoricas.length && !praticas.length) {
        return undefined;
    }

    return { teoricas, praticas };
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
    const horarioRaw = normalizeHorarioRaw(rawUc.horario || {});

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
        horario: horarioRaw,
        horarioNorm: buildHorarioNorm(horarioRaw),
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
        console.log(`Coleção ucs já contém ${existingCount} documentos. Vou adicionar apenas as UCs em falta.`);
    }

    const rawCombined = loadJson('ucs.json');
    const rawUcs = Array.isArray(rawCombined)
        ? rawCombined
        : (Array.isArray(rawCombined.ucs) ? rawCombined.ucs : []);

    if (rawUcs.length === 0) {
        console.log('Nenhuma UC encontrada em data/ucs.json.');
        await mongoose.disconnect();
        return;
    }

    const ucs = rawUcs.map(entry => normalizeUc(entry));
    const operations = ucs.map(uc => ({
        updateOne: {
            filter: { _id: uc._id },
            update: { $setOnInsert: uc },
            upsert: true
        }
    }));

    const result = await ucModel.bulkWrite(operations, { ordered: false });
    const insertedCount = result.upsertedCount || 0;
    const matchedCount = result.matchedCount || 0;

    console.log(`Seed terminado. Inseridas ${insertedCount} UCs novas. Ja existentes: ${matchedCount}.`);
    await mongoose.disconnect();
}

main().catch(async error => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});