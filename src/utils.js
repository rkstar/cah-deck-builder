import fs from "fs";
import stream from "stream";

import csv from "csv-parser";

export const availableSets = (inputFile) => {
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

export const readLines = (input) => {
  const output = new stream.PassThrough({objectMode: true});
  input.pipe(csv()).on("data", (data) => {
    output.write(data);
  });

  return output;
};

export const getCountry = (line) => {
  const fields = line.split(",");
};
