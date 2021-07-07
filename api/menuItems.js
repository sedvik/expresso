const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const menuItemsRouter = express.Router({mergeParams: true});

// Request body parameter validation middleware
const menuItemBodyValidation = (req, res, next) => {
    const menuItem = req.body.menuItem;
    const name = menuItem.name;
    const inventory = Number(menuItem.inventory);
    const price = Number(menuItem.price);

    if (!(name && inventory && price) || (typeof name !== 'string' || typeof inventory !== 'number' || typeof price !== 'number')) {
        res.status(400).send();
    } else {
        next();
    }
};

// :menuItemId param extraction
menuItemsRouter.param('menuItemId', (req, res, next, id) => {
    db.get("SELECT * FROM MenuItem WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                req.menuItemId = id;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/menus/:menuId/menu-items
menuItemsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menu_id;",
        {
            $menu_id: req.menuId
        },
        (err, rows) => {
            if (err) {
                return next(err);
            }
            res.status(200).json({menuItems: rows});
        }
    );
});

// POST /api/menus/:menuId/menu-items
menuItemsRouter.post('/', menuItemBodyValidation, (req, res, next) => {
    const menuItem = req.body.menuItem;
    const description = menuItem.description;
    let sql;
    // Run different SQL statements depending on whether description was supplied or not
    if (description) {
        sql = "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id);";
    } else {
        sql = "INSERT INTO MenuItem (name, inventory, price, menu_id) VALUES ($name, $inventory, $price, $menu_id);";
    }
    db.run(sql,
        {
            $name: menuItem.name,
            $description: description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menu_id: req.menuId
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM MenuItem WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({menuItem: row});
                }
            );
        }
    );
});

// PUT /api/menus/:menuId/menu-items/:menuItemId
menuItemsRouter.put("/:menuItemId", menuItemBodyValidation, (req, res, next) => {
    const menuItem = req.body.menuItem;
    const description = menuItem.description;
    let sql;
    // Run different SQL statements depending on whether description was supplied or not
    if (description) {
        sql = "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id;";
    } else {
        sql = "UPDATE MenuItem SET name = $name, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id;";
    }
    db.run(sql,
        {
            $name: menuItem.name,
            $description: description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menu_id: req.menuId,
            $id: req.menuItemId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM MenuItem WHERE id = $id;",
                {
                    $id: req.menuItemId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({menuItem: row});
                }
            );
        }
    );
});

// DELETE /api/menus/:menuId/menu-items/:menuItemId
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $id;",
        {
            $id: req.menuItemId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            res.status(204).send();
        }
    );
});

module.exports = menuItemsRouter;