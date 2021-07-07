const express = require('express');
const employeesRouter = require('./employees');
const menusRouter = require('./menus');

const apiRouter = express.Router();

// Mount employeesRouter at /api/employees
apiRouter.use('/employees', employeesRouter);

// Mount menusRouter at /api/menus
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;