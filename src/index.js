/*******************************************************************************
express-mega-router - An Express middleware for dynamic routes and middleware.
Copyright (C) 2017 Ketchetwahmeegwun T. Southall / kts of kettek

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*******************************************************************************/
const pathToRegexp = require('path-to-regexp');
/**
 * An express middleware that allows the removing and adding of routes or other
 * middleware.
 *
 * @class MegaRouter
 * @constructor
 * @this {MegaRouter}
 * @property {Object[]} routes - Stored routes, such as: routes['GET'][0]
 * @param {String[]} [methods=['GET','HEAD','POST','PUT','DELETE','CONNECT','OPTIONS','TRACE','PATCH']]  - List of methods to add handlers for. This calls `addMethod` on each provided method. If unspecified, the methods outlined in RFC 7231 and RFC 5789 are used.
 * @example
 * const megaRouter = new require('express-megarouter');
 * app.use('*', megaRouter.getMiddleware());
 *
 * megaRouter.get('/', function(req, res, next) {
 *   next();
 * });
 *
 */
class MegaRouter {
  constructor(methods=['GET','HEAD','POST','PUT','DELETE','CONNECT','OPTIONS','TRACE','PATCH']) {
    this.routes = {};
    methods.forEach(method => {
      this.addMethod(method);
    });
  }
  /**
   * Adds handlers for a given method. Methods are expected to be in UPPER CASE. Lower-cased member functions will be added to the MegaRouter instance for 'method' and 'unmethod'.
   *
   * @param {string} method
   * @example
   * megaRouter.addMethod('CUSTOM');
   * megaRouter.custom('/', (req, res, next) => {
   *   res.send('My CUSTOM method response!');
   * });
   */
  addMethod(method) {
    this.routes[method] = [];
    // Add the method's lowercase name as a member function to this MegaRouter instance
    this[method.toLowerCase()] = (route, ...args) => {
      // Allow for unlimited parameters
      if (args.length > 1) {
        for (let i = 0; i < args.length; i++) {
          this[method.toLowerCase()](route, args[i]);
        }
        return this;
      }
      // Allow for arrays
      if (args[0] instanceof Array) {
        for (let i = 0; i < args[0].length; i++) {
          this[method.toLowerCase()](route, args[0][i]);
        }
        return this;
      }
      // Callback type check
      if (!(args[0] instanceof Function)) {
        throw new Error('provided callback was not a Function');
      }
      // Alright, let's actually add the route
      if (!this.routes[method]) this.routes[method] = [];
      this.routes[method].push({route: pathToRegexp(route), cb: args[0]});
      return this; // allow chaining
    }
    // Add the method's lowercase name with 'un' prepended to it as a member function to this MegaRouter instance
    this['un'+method.toLowerCase()] = (route, ...args) => {
      // Bail early if the route doesn't exist
      if (!this.routes[method]) {
        return this;
      }
      // Check if it is a full route removal
      if (args.length == 0) {
        for (let i = this.routes[method].length-1; i > 0; i--) {
          // Oh boy, this is just a little hackish
          if (this.routes[method][i].route.toString() == pathToRegexp(route).toString()) {
            this.routes[method].splice(i, 1);
          }
        }
        return this;
      }
      // Allow for removal by "unlimited" parameters
      if (args.length > 1) {
        for (let i = 0; i < args.length; i++) {
          this['un'+method.toLowerCase()](route, args[i]);
        }
        return this;
      }
      // Allow for removal by arrays
      if (args[0] instanceof Array) {
        for (let i = 0; i < args[0].length; i++) {
          this['un'+method.toLowerCase()](route, args[0][i]);
        }
        return this;
      }
      // Callback type check
      if (!(args[0] instanceof Function)) {
        throw new Error('provided callback was not a Function');
      }
      // Remove cb if it exists!
      for (let i = 0; i < this.routes[method].length; i++) {
        if (this.routes[method][i].cb === args[0]) {
          this.routes[method].splice(i, 1);
          return this;
        }
      }
      return this;
    }
  }
  /**
   * Returns the middleware function for this MegaRouter instance.
   *
   * @example
   * app.use('/*', megaRouter.getMiddleware());
   */
  get middleware() {
    if (!this._middleware) {
      this._middleware = (req, res, next) => {
        let targets = [];
        let targetsIndex = 0;
        if (this.routes[req.method]) {
          for (let i = 0; i < this.routes[req.method].length; i++) {
            if (this.routes[req.method][i].route.test(req.url)) {
              targets.push(this.routes[req.method][i].cb);
            }
          }
        }
        if (targets.length > 0) {
          function step(index) {
            if (index < targets.length) {
              targets[index](req, res, function() {
                step(index+1)
              });
            } else {
              next();
            }
          }
          step(0);
        } else {
          next();
        }
      }
    }
    return this._middleware;
  }
}

module.exports = function(methods) {
  return new MegaRouter(methods)
};
