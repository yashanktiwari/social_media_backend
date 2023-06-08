require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {handleError} = require('./utils/errorHandling');
const { origin } = require('./utils/constants');

const {connect_db} = require('./db');

const PORT = process.env.PORT;

const app = express();

// Importing Routers
const authRouter = require('./routes/authRouter');
const userRouter = require('./routes/userRouter');

// Middlewares
app.use(cors({ origin: origin, credentials: true }));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.use(cookieParser());


// Routers
app.use('/', authRouter);
app.use('/', userRouter);

app.listen(PORT, () => {
  console.log(`Server is listening at ${PORT}`);
});

// Middleware for error handling
app.use(handleError);

connect_db();