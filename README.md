AS By Country
=============

This is a small module to parse the delegation stats from the regional
registries for which autonomous systems are registered in which countries.

To rebuild the database, remove the `asbycountry.json` table and run
`node rebuild.js`.

To use:
```javascript
var asbycountry = require("asbycountry");
asbycountry["US"].forEach(function (asn) {
  ...
});
```
