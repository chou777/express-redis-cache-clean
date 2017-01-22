# Express Route Cache Clean Tool

Node express route cache by redis


## Example
##### app.js
```
var handleCache = require('./lib/expressRouteCacheClean.js');

var handleCacheConfig = {
  prefix: 'prefix1:development',
  host: '127.0.0.1',
  port: 6379
};

var handleCacheExpire = {
  200: 300,
  '4xx': 30,
  403: 30,
  '5xx': 30,
  xxx: 30
};

app.use(handleCache(handleCacheConfig, handleCacheExpire));
```
##### Route js
```
app.get('/', function(req, res, next) {
  if (req.handleCache) {
    // set cache name
    res.express_redis_cache_name = `${req._parsedOriginalUrl.pathname}`;
    req.handleCache.createRoute(req, res, next);
  } else {
    next();
  }
}, function(req, res, next) {
  console.log('nocache');
  res.send('Show page');
});

```

## Use
##### Clean All
```
localhost:8080/home?nocache=all
```
##### Clean route
```
localhost:8080/home?nocache=route
```

##### Clean Page
```
localhost:8080/home?nocache=page
```

##### No cache mode
```
localhost:8080/home?nocache=testing
```
## License

[GNU General Public License v3.0](http://choosealicense.com/licenses/gpl-3.0/)
