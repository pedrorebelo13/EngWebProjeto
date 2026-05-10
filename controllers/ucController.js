const ucModel = require('../models/ucModel')

const prefersJson = (req) => {
    const acceptHeader = req.get('accept') || '';
    return acceptHeader.includes('application/json');
};

const denyAccess = (req, res, message) => {
    if (prefersJson(req)) {
        return res.status(403).json({ error: message });
    }

    return res.status(403).send(message);
};

const canCreateUc = (user) => {
    return user && (user.role === 'admin' || user.role === 'docente');
};

const canManageUc = (user, uc) => {
    if (!user) {
        return false;
    }

    if (user.role === 'admin') {
        return true;
    }

    if (user.role === 'docente' && uc && uc.createdBy) {
        return uc.createdBy.toString() === user.id;
    }

    return false;
};

const canViewUc = (user, uc) => {
    if (!user || !uc) {
        return false;
    }

    if (user.role === 'admin') {
        return true;
    }

    if (uc.isPublic) {
        return true;
    }

    if (user.role === 'docente' && uc.createdBy) {
        return uc.createdBy.toString() === user.id;
    }

    return false;
};

const normalizeDateField = (dateValue) => {
    if (!dateValue) {
        return { value: null, hasSelection: false };
    }

    if (dateValue instanceof Date) {
        return { value: isNaN(dateValue.getTime()) ? null : dateValue, hasSelection: true };
    }

    if (typeof dateValue === 'string') {
        if (!dateValue.trim()) {
            return { value: null, hasSelection: false };
        }

        const parsed = new Date(dateValue);
        return { value: isNaN(parsed.getTime()) ? null : parsed, hasSelection: true };
    }

    const { dia, mes, ano } = dateValue;
    if (!dia && !mes && !ano) {
        return { value: null, hasSelection: false };
    }

    if (!dia || !mes || !ano) {
        return { value: null, hasSelection: true };
    }

    const parsed = new Date(`${ano}-${mes}-${dia}`);
    return { value: isNaN(parsed.getTime()) ? null : parsed, hasSelection: true };
};

const toJsonDownload = (res, filename, payload) => {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.type('application/json');
    return res.send(JSON.stringify(payload, null, 2));
};

const parseJsonUpload = (req) => {
    if (!req.file || !req.file.buffer) {
        return { error: 'Ficheiro JSON em falta.' };
    }

    const raw = req.file.buffer.toString('utf8');
    if (!raw.trim()) {
        return { error: 'Ficheiro JSON vazio.' };
    }

    try {
        return { payload: JSON.parse(raw) };
    } catch (error) {
        return { error: 'JSON invalido.' };
    }
};

const normalizeStringArray = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }
        if (trimmed.includes(',')) {
            return trimmed.split(',').map(item => item.trim()).filter(Boolean);
        }
        return [trimmed];
    }

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(item => (item === undefined || item === null) ? '' : String(item).trim())
        .filter(Boolean);
};

const splitHorarioEntries = (value) => {
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
};

const normalizeDocentes = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(docente => {
            if (!docente || typeof docente !== 'object') {
                return null;
            }

            const nome = docente.nome ? String(docente.nome).trim() : '';
            const categoria = docente.categoria ? String(docente.categoria).trim() : '';
            const filiacao = docente.filiacao ? String(docente.filiacao).trim() : '';
            const email = docente.email ? String(docente.email).trim() : '';

            if (!nome || !categoria || !filiacao || !email) {
                return null;
            }

            const normalized = {
                nome,
                categoria,
                filiacao,
                email
            };

            if (docente.webpage) {
                normalized.webpage = String(docente.webpage).trim();
            }

            if (docente.foto) {
                normalized.foto = String(docente.foto).trim();
            }

            return normalized;
        })
        .filter(Boolean);
};

const normalizeAulas = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(aula => {
            if (!aula || typeof aula !== 'object') {
                return null;
            }

            const tipo = aula.tipo ? String(aula.tipo).trim() : '';
            const data = aula.data ? String(aula.data).trim() : '';
            const sumario = normalizeStringArray(aula.sumario) || [];

            if (!tipo || !data || sumario.length === 0) {
                return null;
            }

            return { tipo, data, sumario };
        })
        .filter(Boolean);
};

const normalizeHorario = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const toArray = (input) => {
        if (input === undefined || input === null) {
            return [];
        }
        return Array.isArray(input) ? input : [input];
    };

    const teoricas = toArray(value.teoricas)
        .flatMap(entry => splitHorarioEntries(entry))
        .map(entry => String(entry).trim())
        .filter(Boolean);

    const praticas = toArray(value.praticas)
        .flatMap(entry => splitHorarioEntries(entry))
        .map(entry => String(entry).trim())
        .filter(Boolean);

    return { teoricas, praticas };
};

const normalizeTime = (hour, minute) => {
    if (!hour) {
        return '';
    }
    const h = String(hour).padStart(2, '0');
    const m = String(minute || '00').padStart(2, '0');
    return `${h}:${m}`;
};

const parseHorarioEntry = (value) => {
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
};

const buildHorarioNorm = (horario) => {
    if (!horario) {
        return undefined;
    }

    const teoricas = (horario.teoricas || []).map(parseHorarioEntry).filter(Boolean);
    const praticas = (horario.praticas || []).map(parseHorarioEntry).filter(Boolean);

    if (!teoricas.length && !praticas.length) {
        return undefined;
    }

    return { teoricas, praticas };
};

const normalizeDateValue = (value) => {
    if (!value) {
        return undefined;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (isNaN(parsed.getTime())) {
        return undefined;
    }

    return parsed;
};

const normalizeDatasImport = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const datas = {};
    const teste = normalizeDateValue(value.teste);
    const exame = normalizeDateValue(value.exame);
    const projeto = normalizeDateValue(value.projeto);

    if (teste) datas.teste = teste;
    if (exame) datas.exame = exame;
    if (projeto) datas.projeto = projeto;

    if (Object.keys(datas).length === 0) {
        return undefined;
    }

    return datas;
};

const normalizeWebsite = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const website = {};
    if (value.tipo) {
        website.tipo = String(value.tipo).trim();
    }
    if (value.corPrincipal) {
        website.corPrincipal = String(value.corPrincipal).trim();
    }

    return website;
};

const appendArray = (current, incoming) => {
    if (!incoming || incoming.length === 0) {
        return current || [];
    }

    if (!current || current.length === 0) {
        return incoming;
    }

    return current.concat(incoming);
};

const ucController = {
    createUC: async function(req, res) {
        try {
            const existingUC = await ucModel.findById(req.params.id);
            if (!existingUC) {
                return res.status(404).json({ error: "UC não encontrada" });
            }
            if (!canManageUc(req.user, existingUC)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            await existingUC.deleteOne();
            return res.json({ message: "UC apagada com sucesso" });
            if (typeof req.body.isPublic !== 'undefined') {
                const rawValue = String(req.body.isPublic).toLowerCase();
                req.body.isPublic = rawValue === 'true' || rawValue === 'on';
            }

            if (req.body.datas) {
                req.body.datas.teste = normalizeDateField(req.body.datas.teste).value;
                req.body.datas.exame = normalizeDateField(req.body.datas.exame).value;
                req.body.datas.projeto = normalizeDateField(req.body.datas.projeto).value;
            }

            if (req.body.horario) {
                req.body.horario = normalizeHorario(req.body.horario);
                req.body.horarioNorm = buildHorarioNorm(req.body.horario);
            }

            const newUC = new ucModel(req.body);
            await newUC.save();
            
            // Ponto 4: Redirecionar com flag de sucesso no URL
            res.redirect('/uc/ucs?success=true');
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    newUCForm: async function(req, res) {
        try {
            res.render('newUC');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    editUCForm: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: "UC não encontrada" });
            }

            if (!canManageUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            return res.render('newUC', { uc: uc, user: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }, 

    getAllUC: async function(req, res) {
        try {
            // Obter parâmetros de ordenação da querystring (ou usar padrão "sigla")
            const sortField = req.query.sort || 'sigla';
            const sortOrder = req.query.order === 'desc' ? -1 : 1;

            const searchValue = (req.query.search || '').trim();
            const anoValue = (req.query.ano || '').trim();

            const searchFilters = [];
            if (searchValue) {
                const searchRegex = new RegExp(searchValue, 'i');
                searchFilters.push({
                    $or: [
                        { sigla: searchRegex },
                        { titulo: searchRegex }
                    ]
                });
            }

            if (anoValue) {
                const parsedAno = Number(anoValue);
                if (!Number.isNaN(parsedAno)) {
                    searchFilters.push({ ano: parsedAno });
                }
            }

            const filterObj = searchFilters.length ? { $and: searchFilters } : {};

            // Construir objeto de ordenação para o Mongoose
            let sortObj = {};
            sortObj[sortField] = sortOrder;

            const filter = {};
            if (req.user) {
                if (req.user.role === 'aluno') {
                    filter.isPublic = true;
                } else if (req.user.role === 'docente') {
                    filter.$or = [
                        { isPublic: true },
                        { createdBy: req.user.id }
                    ];
                }
            }

            const finalFilter = Object.keys(filterObj).length
                ? (Object.keys(filter).length ? { $and: [filterObj, filter] } : filterObj)
                : filter;

            const ucs = await ucModel.find(finalFilter).sort(sortObj);
            
            // Passar os dados e o estado atual para a view
            res.render('ucs', { 
                list: ucs, 
                currentSort: sortField, 
                currentOrder: req.query.order || 'asc',
                search: searchValue,
                filterAno: anoValue,
                success: req.query.success === 'true', // Para sabermos se acabámos de criar algo
                deleted: req.query.deleted === 'true',  // Para sabermos se apagámos algo
                user: req.user // Passar informação do utilizador autenticado
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUCById: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else if (!canViewUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }
            else {
                res.render('ucID', { uc: uc, user: req.user });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    exportDocentes: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: 'UC nao encontrada' });
            }

            if (!canViewUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            const payload = {
                sigla: uc.sigla,
                docentes: uc.docentes || []
            };

            return toJsonDownload(res, `uc_${uc.sigla}_docentes.json`, payload);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    exportAulas: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: 'UC nao encontrada' });
            }

            if (!canViewUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            const payload = {
                sigla: uc.sigla,
                aulas: uc.aulas || []
            };

            return toJsonDownload(res, `uc_${uc.sigla}_aulas.json`, payload);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    exportUcFull: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: 'UC nao encontrada' });
            }

            if (!canViewUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            const payload = {
                sigla: uc.sigla,
                titulo: uc.titulo,
                ano: uc.ano,
                isPublic: uc.isPublic,
                docentes: uc.docentes || [],
                horario: uc.horario || {},
                horarioNorm: uc.horarioNorm || {},
                avaliacao: uc.avaliacao || [],
                datas: uc.datas || {},
                aulas: uc.aulas || [],
                website: uc.website || {}
            };

            return toJsonDownload(res, `uc_${uc.sigla}_completa.json`, payload);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    importAulas: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: 'UC nao encontrada' });
            }

            if (!canManageUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            const { error, payload } = parseJsonUpload(req);
            if (error) {
                return res.status(400).send(error);
            }

            const rawAulas = Array.isArray(payload) ? payload : payload.aulas;
            const aulas = normalizeAulas(rawAulas);
            if (!aulas || aulas.length === 0) {
                return res.status(400).send('Nenhuma aula valida encontrada no ficheiro.');
            }

            const mode = String(req.body.mode || 'replace').toLowerCase();
            const isAppend = mode === 'append' || mode === 'merge';

            if (isAppend) {
                uc.aulas = appendArray(uc.aulas, aulas);
            } else {
                uc.aulas = aulas;
            }

            await uc.save();

            if (prefersJson(req)) {
                return res.json({ message: 'Aulas importadas com sucesso.', count: aulas.length, mode: isAppend ? 'append' : 'replace' });
            }

            return res.redirect(`/uc/ucs/${uc._id}`);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    importUcFull: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                return res.status(404).json({ error: 'UC nao encontrada' });
            }

            if (!canManageUc(req.user, uc)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            const { error, payload } = parseJsonUpload(req);
            if (error) {
                return res.status(400).send(error);
            }

            const data = payload && payload.uc ? payload.uc : payload;
            if (!data || typeof data !== 'object') {
                return res.status(400).send('Formato de ficheiro invalido.');
            }

            if (data.sigla && String(data.sigla).trim() !== uc.sigla) {
                return res.status(400).send('A sigla do ficheiro nao coincide com a UC atual.');
            }

            const horarioRaw = normalizeHorario(data.horario);
            const update = {
                titulo: data.titulo ? String(data.titulo).trim() : undefined,
                ano: data.ano !== undefined ? Number(data.ano) : undefined,
                isPublic: data.isPublic !== undefined ? !!data.isPublic : undefined,
                docentes: normalizeDocentes(data.docentes),
                horario: horarioRaw,
                horarioNorm: buildHorarioNorm(horarioRaw),
                avaliacao: normalizeStringArray(data.avaliacao),
                datas: normalizeDatasImport(data.datas),
                aulas: normalizeAulas(data.aulas),
                website: normalizeWebsite(data.website)
            };

            const mode = String(req.body.mode || 'replace').toLowerCase();
            const isAppend = mode === 'append' || mode === 'merge';

            if (isAppend) {
                if (update.docentes !== undefined) {
                    uc.docentes = appendArray(uc.docentes, update.docentes);
                }
                if (update.aulas !== undefined) {
                    uc.aulas = appendArray(uc.aulas, update.aulas);
                }
                if (update.avaliacao !== undefined) {
                    uc.avaliacao = appendArray(uc.avaliacao, update.avaliacao);
                }
                if (update.horario !== undefined) {
                    const teoricas = appendArray(uc.horario ? uc.horario.teoricas : [], update.horario.teoricas || []);
                    const praticas = appendArray(uc.horario ? uc.horario.praticas : [], update.horario.praticas || []);
                    uc.horario = { teoricas, praticas };
                }
                if (update.horario !== undefined) {
                    uc.horarioNorm = buildHorarioNorm(uc.horario);
                }
                if (update.datas !== undefined) {
                    uc.datas = { ...uc.datas, ...update.datas };
                }
                if (update.website !== undefined) {
                    uc.website = { ...uc.website, ...update.website };
                }
                if (update.titulo !== undefined) {
                    uc.titulo = update.titulo;
                }
                if (update.ano !== undefined && !Number.isNaN(update.ano)) {
                    uc.ano = update.ano;
                }
                if (update.isPublic !== undefined) {
                    uc.isPublic = update.isPublic;
                }
            } else {
                if (update.titulo !== undefined) uc.titulo = update.titulo;
                if (update.ano !== undefined && !Number.isNaN(update.ano)) uc.ano = update.ano;
                if (update.isPublic !== undefined) uc.isPublic = update.isPublic;
                if (update.docentes !== undefined) uc.docentes = update.docentes;
                if (update.horario !== undefined) uc.horario = update.horario;
                if (update.horarioNorm !== undefined) uc.horarioNorm = update.horarioNorm;
                if (update.avaliacao !== undefined) uc.avaliacao = update.avaliacao;
                if (update.datas !== undefined) uc.datas = update.datas;
                if (update.aulas !== undefined) uc.aulas = update.aulas;
                if (update.website !== undefined) uc.website = update.website;
            }

            await uc.save();

            if (prefersJson(req)) {
                return res.json({ message: 'UC importada com sucesso.', mode: isAppend ? 'append' : 'replace' });
            }

            return res.redirect(`/uc/ucs/${uc._id}`);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUC: async function(req, res) {
        try {
            const existingUC = await ucModel.findById(req.params.id);
            if (!existingUC) {
                return res.status(404).json({ error: "UC não encontrada" });
            }
            if (!canManageUc(req.user, existingUC)) {
                return denyAccess(req, res, 'Acesso negado.');
            }

            if (req.body.horario) {
                req.body.horario = normalizeHorario(req.body.horario);
                req.body.horarioNorm = buildHorarioNorm(req.body.horario);
            }

            if (req.body.datas) {
                const teste = normalizeDateField(req.body.datas.teste);
                const exame = normalizeDateField(req.body.datas.exame);
                const projeto = normalizeDateField(req.body.datas.projeto);

                if (teste.hasSelection) {
                    req.body.datas.teste = teste.value;
                } else {
                    delete req.body.datas.teste;
                }

                if (exame.hasSelection) {
                    req.body.datas.exame = exame.value;
                } else {
                    delete req.body.datas.exame;
                }

                if (projeto.hasSelection) {
                    req.body.datas.projeto = projeto.value;
                } else {
                    delete req.body.datas.projeto;
                }
            }
             // Preservar fotos dos docentes se não houver nova
            if (req.body.docentes && existingUC.docentes) {
                req.body.docentes = req.body.docentes.map((doc, idx) => ({
                    ...doc,
                    foto: doc.foto || existingUC.docentes[idx]?.foto
                }));
            }
            const rawWebsite = (() => {
                if (req.body.website && typeof req.body.website === 'object') {
                    return req.body.website;
                }
                if (req.body.website) {
                    return { tipo: req.body.website };
                }
                const tipo = req.body['website[tipo]'];
                const corPrincipal = req.body['website[corPrincipal]'];
                if (tipo || corPrincipal) {
                    return { tipo, corPrincipal };
                }
                return undefined;
            })();

            const normalizedWebsite = normalizeWebsite(rawWebsite);
            if (normalizedWebsite && Object.keys(normalizedWebsite).length > 0) {
                const baseWebsite = existingUC.website
                    ? (typeof existingUC.website.toObject === 'function' ? existingUC.website.toObject() : existingUC.website)
                    : {};
                const nextWebsite = { ...baseWebsite, ...normalizedWebsite };
                if (nextWebsite.tipo) {
                    req.body['website.tipo'] = nextWebsite.tipo;
                }
                if (nextWebsite.corPrincipal) {
                    req.body['website.corPrincipal'] = nextWebsite.corPrincipal;
                }
            }
            delete req.body.website;
            delete req.body['website[tipo]'];
            delete req.body['website[corPrincipal]'];
            const updatedUC = await ucModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
           if (!updatedUC) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.render('ucID', { uc: updatedUC, user: req.user });
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteUC: async function(req, res) {
        try {
            const deletedUC = await ucModel.findByIdAndDelete(req.params.id);
            if (!deletedUC) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.json({ message: "UC apagada com sucesso" });

            }



        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getStats: async function(req, res) {
        try {
            const ucs = await ucModel.find();
            res.json({ count: ucs.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ucController;