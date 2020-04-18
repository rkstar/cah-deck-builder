import fs from "fs";

import csv from "csv-parser";

const sanitizeFilename = (set) =>
  set
    .replace(/^\s/, "")
    .replace(/[\W_]+/g, "-")
    .toLowerCase();
const sanitizeText = (text) =>
  text.includes(",") ? `"${text.replace(/"/g, "'")}"` : text;
const processSourceData = (cardType, text, set, writeDir) => ({
  writeFile: `${writeDir}/${cardType}.csv`,
  displaySet: set && set.replace(/^\s/, ""),
  safeSet: set && sanitizeFilename(set),
  safeText: text && sanitizeText(text),
  header: `Label,${cardType}\n`,
});
const rmnl = (str, repl = "") => str.replace(/\n/g, repl);

// read in the file and write out files
// for each set
export function generateSourceFiles(cardType, inputFile, writeDir) {
  const openFiles = [];
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on("data", (raw) => {
      const [text, set] = Object.values(raw);
      const {displaySet, safeSet, safeText, header} = processSourceData(
        cardType,
        text,
        set,
        writeDir
      );
      const writeFile = `${writeDir}/${safeSet}-${cardType}.csv`;
      // 2. check to see if filename is in openFiles,
      //    if not, write the header [Label, <cardType>]
      //    and add it to openFiles
      if (!openFiles.includes(writeFile)) {
        fs.writeFileSync(writeFile, header);
        openFiles.push(writeFile);
      }

      // only keep text strings that start with a capital letter
      const rx = RegExp(/^[A-Z]/);
      if (rx.test(safeText)) {
        fs.appendFileSync(
          writeFile,
          `${rmnl(displaySet)},${rmnl(safeText, " ")}\n`
        );
      }
    });
}

export function mergeSourceFiles(sets, sourceDir, writeDir) {
  let promptFileExists = false;
  let responseFileExists = false;
  sets.forEach((set, i) => {
    const promptFile = `${sourceDir}/${sanitizeFilename(set)}-prompt.csv`;
    fs.createReadStream(promptFile)
      .pipe(csv())
      .on("data", (raw) => {
        const [set, text] = Object.values(raw);
        const {writeFile, displaySet, safeText, header} = processSourceData(
          "prompt",
          text,
          set,
          writeDir
        );

        if (!promptFileExists) {
          fs.writeFileSync(writeFile, header);
          promptFileExists = true;
        }

        fs.appendFileSync(
          writeFile,
          `${rmnl(displaySet)},${rmnl(safeText, " ")}\n`
        );
      })
      .on(
        "end",
        () => i === sets.length && console.log("prompts file written.")
      );

    const responseFile = `${sourceDir}/${sanitizeFilename(set)}-response.csv`;
    fs.createReadStream(responseFile)
      .pipe(csv())
      .on("data", (raw) => {
        const [set, text] = Object.values(raw);
        const {writeFile, displaySet, safeText, header} = processSourceData(
          "response",
          text,
          set,
          writeDir
        );

        if (!responseFileExists) {
          fs.writeFileSync(writeFile, header);
          responseFileExists = true;
        }

        fs.appendFileSync(
          writeFile,
          `${rmnl(displaySet)},${rmnl(safeText, " ")}\n`
        );
      })
      .on(
        "end",
        () => i === sets.length && console.log("responses file written.")
      );
  });
}
