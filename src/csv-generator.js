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
const ignoreBaseSet = (set) => set === "cah-base-set";

// read in the file and write out files
// for each set
export function generateSourceFiles(cardType, inputFile, writeDir) {
  const openFiles = [];
  const setNames = new Set();
  return new Promise((resolve) => {
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
        if (!safeSet || ignoreBaseSet(safeSet)) return;
        setNames.add(displaySet);
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
      })
      .on("end", () => resolve(Array.from(setNames)));
  });
}

export function makeRegionalBaseSets(inputFile, writeDir) {
  const openFiles = [];
  const setNames = new Set();
  return new Promise((resolve) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("headers", (headers) => {
        // console.log(headers);
      })
      .on("data", ({Text: text, US, UK, AU, CA, INTL, ...rest}) => {
        // not really sure WHY all this fuckery is required...
        const [type] = Object.keys(rest);
        const cardType = rest[type].toLowerCase();
        const set = "CAH Base Set";
        const regions = INTL
          ? ["US", "UK", "AU", "CA"]
          : [US && "US", UK && "UK", AU && "AU", CA && "CA"].filter((el) =>
              Boolean(el)
            );
        const {displaySet, safeSet, safeText, header} = processSourceData(
          cardType,
          text,
          set,
          writeDir
        );
        regions.forEach((region) => {
          setNames.add(`${displaySet} (${region})`);
          const writeFile = `${writeDir}/${safeSet}-${region}--${cardType}.csv`;
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
              `${rmnl(displaySet)} (${region}),${rmnl(safeText, " ")}\n`
            );
          }
        });
      })
      .on("end", () => resolve(Array.from(setNames)));
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
        const [promptSet, text] = Object.values(raw);
        const {writeFile, displaySet, safeText, header} = processSourceData(
          "prompt",
          text,
          promptSet,
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
        const [responseSet, text] = Object.values(raw);
        const {writeFile, displaySet, safeText, header} = processSourceData(
          "response",
          text,
          responseSet,
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
