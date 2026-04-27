const express = require('express');
const mongoose = require('mongoose');
const app = express();
const ucRouter = require('./routes/ucRouter');
const authRouter = require('./routes/authRouter');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 1. Conexão ao MongoDB
const nomeBD = "projetoEW"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro:', err));

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use('/uc', ucRouter);
app.use('/auth', authRouter);

const PORT = process.env.PORT || 16000
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
})
