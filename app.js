const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const ucRouter = require('./routes/ucRouter');
const authRouter = require('./routes/authRouter');
const usersRouter = require('./routes/usersRouter');
const { attachUserFromCookie } = require('./cookies/cookieAuthMiddleware');
const upload = require('./config/multer');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUserFromCookie);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.upload = upload;
app.use(express.static(path.join(__dirname, 'views', 'public')));

// 1. Conexão ao MongoDB
const nomeBD = "projetoEW"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`
mongoose.connect(mongoHost)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
    .catch(err => console.error('Erro:', err));

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/uc', ucRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);

const PORT = process.env.PORT || 16000
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
})
