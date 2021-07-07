const express = require('express');
const timesheetsRouter = require('./timesheets');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const employeesRouter = express.Router();

// Request body parameter validation middleware
const employeeBodyValidation = (req, res, next) => {
    const employee = req.body.employee;
    const name = employee.name;
    const position = employee.position;
    const wage = Number(employee.wage);

    if (!(name && position && wage) || (typeof name !== 'string' || typeof position !== 'string' || typeof wage !== 'number')) {
        res.status(400).send();
    } else {
        next();
    }
};

// :employeeId param extraction
employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get("SELECT * FROM Employee WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => { 
            if (err) {
                return next(err);
            } else if (row) {
                req.employeeId = id;
                req.employee = row;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/employees
employeesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1;",
        (err, rows) => {
            if (err) {
                return next(err);
            }
            res.status(200).json({employees: rows});
        }
    );
});

// POST /api/employees
employeesRouter.post('/', employeeBodyValidation, (req, res, next) => {
    const employee = req.body.employee;
    // If isCurrentEmployee is set and has a value of 0, keep it as 0. Otherwise, pre-emptively set at 1 to simplify SQL statement despite is_current_employee having a default value of 1;
    const isCurrentEmployee = employee.isCurrentEmployee == 0 ? 0 : 1;
    db.run("INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $is_current_employee);",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $is_current_employee: isCurrentEmployee
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Employee WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({employee: row})
                }
            );
        }
    );
});

// GET /api/employees/:employeeId
employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee});
});

// PUT /api/employees/:employeeId
employeesRouter.put('/:employeeId', employeeBodyValidation, (req, res, next) => {
    const employee = req.body.employee;
    db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id;",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $id: req.employeeId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Employee WHERE id = $id;",
                {
                    $id: req.employeeId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({employee: row});
                }
            );
        }
    );
});

// DELETE /api/employees/:employeeId - Updates is_current_employee from 1 to 0. Does not fully delete the employee from the db.
employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $id;",
        {
            $id: req.employeeId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Employee WHERE id = $id;",
                {
                    $id: req.employeeId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({employee: row});
                }
            );
        }
    );
});

// Mount timesheetsRouter at /api/employees/:employeeId/timesheets
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

module.exports = employeesRouter;