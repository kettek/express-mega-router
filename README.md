# express-mega-router
A simple Express middleware that allows for dynamic routing and middleware.

It uses `path-to-regexp` for route parsing, thereby imposing all limitations inherent within.

Uses Babel for transpiling ES6 into ES5.

## Installation
    npm install express-mega-router --save

## Usage
    const express     = require('express');
    const megaRouter  = require('express-mega-router')();

    const app = express();
    app.use(megaRouter.middleware);

### Basic route
    megaRouter.get('/test', function(req, res) {
      res.send('Test Route');
    });

### Catch all methods
    megaRouter.all('/*', function(req, res, next) {
      console.log('catch-all engaged!');
      next();
    });

### One-time use route
    function singleUseRoute(req, res) {
      res.send('Single-use route!');
      megaRouter.unget('/*', singleUseRoute);
    });
    megaRouter.get('/*', singleUseRoute);

### Clearing all routes for a path
    megaRouter.unget('/*');

### Mixed route arguments
    megaRouter.get('/*',
      function(req, res, next) {
        console.log('A');
        next();
      },
      function(req, res, next) {
        console.log('B');
        next();
      },
      [
        function(req, res, next) {
          console.log('C');
          next();
        },
        function(req, res, next) {
          console.log('D');
          next();
        }
      ]);

## License
GPLv3
