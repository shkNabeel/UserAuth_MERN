const express = require('express');
const dbConnect = require('./database/connect');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser=require('cookie-parser');
const app = express();
const dotenv = require('dotenv');
const router = require('./routes/index');
const path = require('path');



dotenv.config(); // Load environment variables from dotenv file

const { PORT } = require('./config/variables');

app.use(express.json());
app.use(cookieParser());
app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use(router);
dbConnect();
app.use(errorHandler);
 
app.listen(PORT, console.log(`Server started at: http://localhost:${PORT}`));