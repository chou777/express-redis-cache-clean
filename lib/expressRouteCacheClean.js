var expressRedisCache = require('express-redis-cache');
var crypto = require('crypto');
var util = require('util');
var redis = require('redis');
var client = null;
var routePrefix = 'route';
var pathPrefix = 'path';
var cursor = '0';

var defaultExpire = {
  200: 600,
  '4xx': 30,
  403: 30,
  '5xx': 30,
  xxx: 30
};

var fddCache = {
  init: function(config) {
    this.config = config;
    this.expressCache = expressRedisCache(config);

    // Client dont't set prefix scan not work.
    client = redis.createClient({
      host: config.host,
      port: config.port
    });
  },
  // Create route cache
  createRoute: function(req, res, next, expire) {
    var shasum;
    var routeKey;

    // Testing nocache mode Check new version.
    if (req.query.nocache === 'testing') {
      next();
      return;
    }
    // Generator route key and cache count.
    shasum = crypto.createHash('sha1');
    shasum.update(String(req.route.path), 'utf8');
    routeKey = shasum.digest('hex');

    // Set new redis name. routePrefix +  redisRouteKey + path
    res.express_redis_cache_name = `${routePrefix}-${routeKey}-${pathPrefix}:${res.express_redis_cache_name}`;
    if (req.query.nocache === 'page') {
      this.expressCache.del(res.express_redis_cache_name, function(err) {
        if (!err) {
          res.send('Success Clear Cache page');
        } else {
          res.send('Clear cache error.');
        }
      });
    } else if (req.query.nocache === 'route') {
      this.resetCache(req, res, next, `${this.config.prefix}:${routePrefix}-${routeKey}-*`,
        function(err) {
          if (!err) {
            res.send('Success Clear Cache route');
          } else {
            res.json(err);
          }
        }
      );
    } else if (req.query.nocache === 'all') {
      this.resetCache(req, res, next, `${this.config.prefix}:${routePrefix}-*`,
        function(err) {
          if (!err) {
            res.send('Success Clear Cache all');
          } else {
            res.json(err);
          }
        }
      );
    } else if (typeof req.query.nocache === 'undefined') {
      this.expressCache.route({
        // eslint-disable-next-line no-underscore-dangle
        expire: util._extend(defaultExpire, expire)
      })(req, res, next);
    } else {
      res.send('invalid params');
    }
  },
  // Reset cache multi by redis scan
  resetCache: function(req, res, next, pattern, callback) {
    var i;
    if (typeof pattern === 'undefined') {
      next();
    }
    client.scan(
      cursor,
      'MATCH', pattern,
      'COUNT', '10000',
      function(err, response) {
        var keys;
        if (err) {
          return callback(err);
        }
        // Update the cursor position for the next scan
        cursor = response[0];
        // get the SCAN responseult for this iteration
        keys = response[1];

        if (keys.length > 0) {
          for (i = 0; i < keys.length; i++) {
            client.del(keys[i]);
          }
        }
        if (cursor === '0') {
          return callback(false);
        }
        return fddCache.resetCache(req, res, next, pattern, callback);
      }
    );
  }
};


module.exports = function(config, expire) {
  // Cache init.
  fddCache.init(config);
  if (!expire) {
    console.error(new Error('Fdd redis cache expire is required.'));
  } else {
    // eslint-disable-next-line no-underscore-dangle
    util._extend(defaultExpire, expire);
  }
  return function(req, res, next) {
    req.fddCache = fddCache;
    next();
  };
};
