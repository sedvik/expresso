const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const menuItemsRouter = express.Router({mergeParams: true});

// :menuItemId param extraction

// GET /api/menus/:menuId/menu-items

// POST /api/menus/:menuId/menu-items

// PUT /api/menus/:menuId/menu-items/:menuItemId

// DELETE /api/menus/:menuId/menu-items/:menuItemId

module.exports = menuItemsRouter;