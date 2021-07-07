const express = require('express');
const menuItemsRouter = require('./menuItems');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const menusRouter = express.Router();

// :menuId param extraction

// GET /api/menus

// POST /api/menus

// GET /api/menus/:menuId

// PUT /api/menus/:menuId

// DELETE /api/menus/:menuId

// Mount menuItemsRouter at /api/menus/:menuId/menu-items
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

module.exports = menusRouter;