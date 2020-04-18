const fs = require("fs");

const csv = require("csv-parser");
const similarity = require("string-similarity");
const inquirer = require("inquirer");

const {readLines} = require("./utils");

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

const decks = {};

// read in the file and write out files
// for each set
async function generateSourceFiles(cardType, inputFile, writeDir) {
  const openFiles = [];
  let lastText = "";
  const input = fs.createReadStream(inputFile);
  for await (const raw of readLines(input)) {
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
      // 3. check string similarity
      const score = similarity.compareTwoStrings(lastText, safeText);
      if (score === 1) continue;
      if (score > 0.4) {
        // 1. display both lines
        // 2. ask to keep first, second, or both.
        const {option} = await inquirer.prompt([
          {
            type: "list",
            name: "option",
            message: "Which line would you like to keep?",
            choices: [
              {name: lastText, value: 0},
              {name: safeText, value: 1},
              {name: "Both", value: 2},
              {name: "Neither", value: 3},
            ],
          },
        ]);

        switch (option) {
          case 0:
            // if (first) ... keep first in lastText and move to next entry
            // do nothing...
            return;

          case 1:
            // if (second) ... put second in lastText and move to next entry
            lastText = safeText;
            return;

          case 2:
            // if (both) ... commit lastText to file and move to next entry
            fs.appendFileSync(
              writeFile,
              `${rmnl(displaySet)},${rmnl(lastText, " ")}\n`
            );
            break;

          case 3:
            // if (neither) ... we want to continue!
            continue;
        }
      }
      // these lines are different enough... write lastText to file
      lastText = safeText;
      console.log("writing:", lastText);
      fs.appendFileSync(
        writeFile,
        `${rmnl(displaySet)},${rmnl(lastText, " ")}\n`
      );
    }
  }
  console.log("over!");
}

function mergeSourceFiles(sets, sourceDir, writeDir) {
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

module.exports = {generateSourceFiles, mergeSourceFiles};
