const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ucModel = require('./models/ucModel');

const nomeBD = 'projetoEW';
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;

function loadJson(fileName) {
    const filePath = path.join(__dirname, fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

    return {
        _id: rawUc.sigla,
        sigla: rawUc.sigla,
        titulo: rawUc.titulo,
        ano: rawUc.ano || (yearMatch ? Number(yearMatch[1]) : new Date().getFullYear()),
        docentes: rawUc.docentes || [],
        horario: rawUc.horario || { teoricas: [], praticas: [] },
        avaliacao: rawUc.avaliacao || [],
        datas: rawUc.datas || {},
        aulas: normalizedAulas,
        website: {
            tipo: rawUc.website?.tipo || 'A',
            corPrincipal: rawUc.website?.corPrincipal || rawUc.website?.['cor principal'] || 'blue'
        }
    };
}

async function main() {
    await mongoose.connect(mongoHost);

    const files = ['metaATP2023.json', 'metaENGWEB2024.json', 'metaRPCW2024.json'];
    const ucs = files.map(fileName => normalizeUc(loadJson(fileName)));

    await ucModel.deleteMany({});
    await ucModel.insertMany(ucs);

    console.log(`Inseridas ${ucs.length} UCs na coleção ucs.`);
    await mongoose.disconnect();
}

main().catch(async error => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});