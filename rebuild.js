var chalk = require("chalk");
var es = require("event-stream");
var fs = require("fs");
var ftpstream = require("ftp-stream");
var request = require("request");
var reduce = require("stream-reduce");
var parseurl = require("url").parse;

// entities from http://www.irr.net/docs/list.html
var delegations = [
  "ftp://ftp.ripe.net/ripe/stats/delegated-ripencc-extended-latest", //ripe
  "http://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-extended-latest", //afrinic
  "ftp://ftp.apnic.net/public/apnic/stats/apnic/delegated-apnic-extended-latest", //apnic
  "ftp://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest", //arin
  "ftp://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-extended-latest" // lacnic
];

var getAndParseFile = function (url, callback) {
  var parts = parseurl(url);
  if (parts.protocol === "ftp:") {
    ftpstream({
      host: parts.host
    }, parts.path.substr(1)).on("data", function (file) {
      parseFile(url, file, callback);
    }).on("error", function(err) {
      console.error(chalk.red(err));
    });
  } else {
    parseFile(url, request(url), callback);
  }
};

/**
 * Given a textual income stream in the 'delegated' rir stats format
 * create a mapping from country to AS number.
 */
var parseFile = function (url, stream, callback) {
  stream
      .pipe(es.split("\n"))
      .pipe(es.mapSync(function(data) {
        return data.split("|");
      }))
      .pipe(reduce(function(map, line) {
        if (line[2] === "asn" &&
            line[1] !== "*" &&
            line[1].length) {
          if (!map[line[1]]) {
            map[line[1]] = [];
          }
          map[line[1]].push(line[3]);
        }
        return map;
      }, {}))
      .on("data", function(map) {
        var domain = parseurl(url).host;
        var asncount = Object.keys(map).map(function(country) {
          return map[country].length;
        }).reduce(function (a, b) {
          return a + b;
        }, 0);

        console.log(domain + ":",  chalk.blue(Object.keys(map).length),
            "Countries.", chalk.blue(asncount), "ASNs.");

        callback(null, map);
      })
      .on("error", function(err) {
        console.error(chalk.red(err));
        callback(err);
      });
};

if (fs.existsSync("asbycountry.json")) {
  console.log(chalk.red("Cowardly refusing to overwrite existing asbycountry.json."));
  process.exit(0);
}

// Allow programatic re-building
var onCompletion = function () {};
module.exports = function (onDone) {
  onCompletion = onDone;
};

es.readArray(delegations)
    .pipe(es.map(getAndParseFile))
    .pipe(reduce(function(combined, map) {
      Object.keys(map).forEach(function (country) {
        if (!combined[country]) {
          combined[country] = [];
        }
        combined[country] = combined[country].concat(map[country]);
      });
      return combined;
    }, {}))
    .on("data", function(map) {
      console.log(chalk.green("Writing to asbycountry.json.."));
      fs.writeFileSync("asbycountry.json", JSON.stringify(map));
      console.log(chalk.green("Done."));
      onCompletion(map);
    })
    .on("error", function(err) {
      console.error(chalk.red(err));
    });
