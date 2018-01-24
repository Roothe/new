const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//returns 200 response containing all saved timesheets related to employee
//with supplied employee ID on timesheets property of request body. If
//returns 404 response if employee ID doesn't exist
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = { $employeeId: req.params.employeeId};
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});

//creates new timesheet related to the employee with the supplied employee
//ID, with info from the timesheet property of the request body, saves it
//to database. Returns 201 response with newly-created timesheet on timesheet
//property of response body. Returns 404 response if employee ID doesnt exist
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;
        employeeId = req.body.timesheet.employeeId;
  if (!hours || !rate || !date) {
          return res.sendStatus(400);
        }

      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
          'VALUES ($hours, $rate, $date, $employeeId)';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: req.params.employeeId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              res.status(201).json({timesheet: timesheet});
            });
        }
  });
});

//Updates timesheet with specified timesheet ID using the info from the
//timesheet property of request body, saves it to database. Returns 200
//response with updated timesheet on the timesheet property of the response
//body. 400 response if required fields missing, 404 response if employee ID
//or timesheet ID doesnt exist.
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.body.timesheet.employeeId;
      if (!hours || !rate || !date) {
        return res.sendStatus(400);
      }

      const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, ' +
          'date = $date, employee_id = $employeeId ' +
          'WHERE Timesheet.id = $timesheetId';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId
      };

      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
            (error, timesheet) => {
              res.status(200).json({timesheet: timesheet});
            });
    }
  });
});

//Deletes timesheet with the supplied timesheet ID from the database.
//Returns a 204 response. 404 if employee ID or timesheet ID doesnt exist
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});



module.exports = timesheetsRouter;
