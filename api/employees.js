//REQUIRE EXPRESS, DATABASE, EMPLOYEES ROUTER
const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');

//checks employee id exists & sends 404 response if not. Stops repetition
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if(error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//Returns a 200 response containing all saved currently-employed employees
//(is_current_employee equal to 1) on employees property of response body
employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({employees: employees});
      }
    });
});

//return 200 response containing employee with supplied employee ID on
//employee property of response body. return 404 response if supplied
//employee ID doesn't exist
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});


//Creates a new employee from employee property of request body. Returns 201 response with newly created employee
//on employee property of response body. Returns 400 if any required fields are missing.
//JavaScript uses camelCase, sql doesn't
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
      'VALUES ($name, $position, $wage, $isCurrentEmployee)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

//Updates employee with specified employee ID using info from employee
//property of request body, saves it to database. Returns 200 response with
//updated employee on employee property of the response body. 400 response
//if required fields missing. 404 response if employee ID doesnt exist
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Employee SET name = $name, position = $position, ' +
      'wage = $wage, is_current_employee = $isCurrentEmployee ' +
      'WHERE employee.id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

//Updates employee with specified employee ID to be unemployed
//(is_current_employee equal to 0). Returns 200 response. 404 response
//If an employee with the supplied employee ID doesn't exist
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const values = {$employeeId: req.params.employeeId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

module.exports = employeesRouter;
