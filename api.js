const express = require('express');
const apiRouter = express.Router();

//TELL THE ROUTER WHICH PATHS TO GO TO
const employeesRouter = require('./employees.js');
const menuRouter = require('./menu.js');

//MOUNT ROUTER & ROUTER
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/menu', menuRouter);

module.exports = apiRouter;
