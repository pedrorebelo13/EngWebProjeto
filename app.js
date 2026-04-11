const express = require('express');
const mongoose = require('mongoose');
const app = express();
const ucRouter = require('./routes/ucRouter');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// 1. Conexão ao MongoDB
const nomeBD = "projetoEW"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro:', err));

app.use('/uc', ucRouter);

const PORT = process.env.PORT || 16000
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
})
