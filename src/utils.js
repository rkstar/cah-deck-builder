const fs = require("fs");
const stream = require("stream");

const csv = require("csv-parser");

const availableSets = (inputFile) => {
  return new Promise((resolve) => {
    const sets = new Set();
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (raw) => {
        const [, set] = Object.values(raw);
        sets.add(set.replace(/^\s/, ""));
      })
      .on("end", () => resolve([...sets].sort()));
  });
};

const readLines = (input) => {
  const output = new stream.PassThrough({objectMode: true});
  input.pipe(csv()).on("data", (data) => {
    output.write(data);
  });

  return output;
};

const getCountry = (line) => {
  const fields = line.split(",");
};

module.exports = {
  availableSets,
  readLines,
};
