//REQUIRE EXPRESS, DATABASE, EMPLOYEES ROUTER
const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemRouter = require('./menu-items.js');

//checks employee id exists & sends 404 response if not. Stops repetition
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const values = {$menuId: menuId};
  db.get(sql, values, (error, menu) => {
    if(error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemRouter);

//Returns a 200 response containing all saved menus on the menus property of the response body
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menus: menus});
    }
  });
});

//Create new menu with info from the menu property of the request body
//save to database. Return 201 response with newly-created menu on the
//menu property of the response body. 400 response if missing required fields
menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values = {
    $title: title
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});


//Returns 200 response containing the menu with supplied menu ID on the menu property of the response body
//404 response if menu with the supplied menu ID doesn't exist
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title WHERE menu.id = $menuId';
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

//Deletes menu with supplied menu ID from the database if that
//menu has no related menu items. Returns a 204 response. If the menu
//has related menu items returns 400 response, if doesnt exist 404 response

menusRouter.delete('/:menuId', (req, res, next) => {
  const menuitemsSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const menuitemsValues = {$menuId: req.params.menuId};
  db.get(menuitemsSql, menuitemsValues, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      res.sendStatus(400);  
    } else {
      const deleteSql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
      const deleteValues = {$menuId: req.params.menuId};

      db.run(deleteSql, deleteValues, (error) => {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = menusRouter;
