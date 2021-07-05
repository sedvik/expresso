const express = require('express');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 4000;

// Set up body parsing, cors, error handling, and logging middleware
app.use(express.urlencoded());
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(errorhandler());

// Mount /api router
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}...`);
});

// Export express app for testing
module.exports = app;