const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const timesheetsRouter = express.Router({mergeParams: true});

// Request body parameter validation middleware
const timesheetBodyValidation = (req, res, next) => {
    const timesheet = req.body.timesheet;
    const hours = Number(timesheet.hours);
    const rate = Number(timesheet.rate);
    const date = Number(timesheet.date);

    if (!(hours && rate && date) || (typeof hours !== 'number' || typeof rate !== 'number' || typeof date !== 'number')) {
        res.status(400).send();
    } else {
        next();
    }
};

// :timesheetId param extraction
timesheetsRouter.param('timesheetId', (req, res, next, id) => {
    db.get("SELECT * FROM Timesheet WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                req.timesheetId = id;
                req.timesheet = row;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/employees/:employeeId/timesheets
timesheetsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Timesheet WHERE employee_id = $employee_id;",
        {
            $employee_id: req.employeeId
        },
        (err, rows) => {
            if (err) {
                return next(err);
            } else if (rows) {
                res.status(200).json({timesheets: rows});
            } else {
                res.status(404).send();
            }
        }
    );
});

// POST /api/employees/:employeeId/timesheets
timesheetsRouter.post('/', timesheetBodyValidation, (req, res, next) => {
    const timesheet = req.body.timesheet
    db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id);",
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employee_id: req.employeeId
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Timesheet WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({timesheet: row});
                }
            );
        }
    );
});

// PUT /api/employees/:employeeId/timesheets/:timesheetId
timesheetsRouter.put('/:timesheetId', timesheetBodyValidation, (req, res, next) => {
    const timesheet = req.body.timesheet;
    db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employee_id WHERE id = $id;",
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employee_id: req.employeeId,
            $id: req.timesheetId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Timesheet WHERE id = $id;",
                {
                    $id: req.timesheetId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({timesheet: row});
                }
            );
        }
    );
});

// DELETE /api/employees/:employeeId/timesheets/:timesheetId
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    db.run("DELETE FROM Timesheet WHERE id = $id;",
        {
            $id: req.timesheetId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            res.status(204).send();
        }
    );
});

module.exports = timesheetsRouter;