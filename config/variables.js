const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from dotenv file

module.exports = {
    PORT: parseInt(process.env.PORT), // Parse PORT as an integer
    MONGODB_CONNECTION_URL: process.env.MONGODB_CONNECTION_URL,
    BACKEND_SERVER_PATH: process.env.BACKEND_SERVER_PATH,
};
