var chalk = require("chalk");
var fs = require("fs");
var path = require("path");

var builtfile = path.resolve(__dirname, "asbycountry.json");

if (fs.existsSync(builtfile)) {
  module.exports = JSON.parse(fs.readFileSync(builtfile));
} else {
  console.error(chalk.red("AS By Country database has not been generated."));
  module.exports = [];
}
