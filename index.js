var chalk = require("chalk");
var fs = require("fs");

if (fs.existsSync) {
  module.exports = JSON.parse(fs.readFileSync("asbycountry.json"));
} else {
  console.error(chalk.red("AS By Country database has not been generated."));
  module.exports = [];
}
