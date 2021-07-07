const express = require('express');
const menuItemsRouter = require('./menuItems');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const menusRouter = express.Router();

// Request body parameter validation middleware
const menuBodyValidation = (req, res, next) => {
    const menu = req.body.menu;
    const title = menu.title;

    if (!title || (typeof title !== 'string')) {
        res.status(400).send();
    } else {
        next();
    }
};

// :menuId param extraction
menusRouter.param('menuId', (req, res, next, id) => {
    db.get("SELECT * FROM Menu WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                req.menuId = id;
                req.menu = row;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/menus
menusRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Menu;",
        (err, rows) => {
            if (err) {
                return next(err);
            }
            res.status(200).json({menus: rows});
        }
    );
});

// POST /api/menus
menusRouter.post('/', menuBodyValidation, (req, res, next) => {
    const menu = req.body.menu;
    db.run("INSERT INTO Menu (title) VALUES ($title);",
        {
            $title: menu.title
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Menu WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({menu: row});
                }
            );
        }
    );
});

// GET /api/menus/:menuId
menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

// PUT /api/menus/:menuId
menusRouter.put('/:menuId', menuBodyValidation, (req, res, next) => {
    const menu = req.body.menu;
    db.run("UPDATE Menu SET title = $title WHERE id = $id;",
        {
            $title: menu.title,
            $id: req.menuId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Menu WHERE id = $id;",
                {
                    $id: req.menuId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({menu: row});
                }
            );
        }
    );
});

// DELETE /api/menus/:menuId - cannot delete menu that has related menu items
menusRouter.delete('/:menuId', (req, res, next) => {
    db.get("SELECT * FROM MenuItem WHERE menu_id = $menu_id;",
        {
            $menu_id: req.menuId
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                return res.status(400).send();
            }
            db.run("DELETE FROM Menu WHERE id = $id;",
                {
                    $id: req.menuId
                },
                (err) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(204).send();
                }
            );
        }
    );
});

// Mount menuItemsRouter at /api/menus/:menuId/menu-items
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

module.exports = menusRouter;