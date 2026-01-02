// Set DEBUG for MongoDB connection only
process.env.DEBUG = process.env.DEBUG || 'development:mongoose-connection';

const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const db = require('./config/mongoose-connection');
const path = require('path');
const expressSession = require('express-session');



const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/index');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    expressSession({
        secret: '_this_is_a_secret_key_for_session_',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set to true if using HTTPS
    })
);

app.use('/', indexRouter);
app.use('/owners', ownersRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

