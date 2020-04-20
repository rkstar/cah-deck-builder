import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import inquirer from "inquirer";

import {
  generateSourceFiles,
  makeRegionalBaseSets,
  mergeSourceFiles,
} from "./src/csv-generator.js";
import {availableSets, generateAvailableSets} from "./src/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setNamesFile = path.resolve(__dirname, "./assets/available-sets.csv");
const baseSetFile = path.resolve(__dirname, "./assets/all-base-sets.csv");
const promptsFile = path.resolve(__dirname, "./assets/prompts-all-sets.csv");
const responsesFile = path.resolve(
  __dirname,
  "./assets/responses-all-sets.csv"
);
const sourceDir = path.resolve(__dirname, "./assets/decks");

// figure out what it is we want!
async function main() {
  const {refreshSourceFiles} = await inquirer.prompt([
    {
      type: "confirm",
      name: "refreshSourceFiles",
      message: "Do you wish to refresh the master list of prompts/responses?",
      choices: ["yes", "no"],
    },
  ]);

  if (refreshSourceFiles) {
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir);
    }
    console.log("starting to write master list...");
    const expansionSetNames = await generateSourceFiles(
      "prompt",
      promptsFile,
      sourceDir
    );
    console.log("prompts written.");
    await generateSourceFiles("response", responsesFile, sourceDir);
    console.log("responses written.");
    const regionalBaseSetNames = await makeRegionalBaseSets(
      baseSetFile,
      sourceDir
    );
    console.log("regional base sets written");

    expansionSetNames.sort();
    regionalBaseSetNames.sort();
    generateAvailableSets(
      [...regionalBaseSetNames, ...expansionSetNames],
      setNamesFile
    );
    console.log("available set names written.");
  }

  const {writeNewFiles} = await inquirer.prompt([
    {
      type: "confirm",
      name: "writeNewFiles",
      message: "Do you wish to create a playing deck now?",
      choices: ["yes", "no"],
    },
  ]);

  if (!writeNewFiles) {
    process.exit(0);
  }

  const {selectedSets} = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedSets",
      message: "Which set(s) would you like to play with today?",
      choices: () => availableSets(setNamesFile),
    },
  ]);

  const {writeDir} = await inquirer.prompt([
    {
      type: "input",
      name: "writeDir",
      message: "Where would you like the prompt/response csv files written?",
      default: "./",
    },
  ]);

  // check to see if we have an absolute path or not
  const doNotResolve = RegExp(/^(?:\/|~)/).test(writeDir)
  mergeSourceFiles(selectedSets, sourceDir, doNotResolve ? writeDir : path.resolve(__dirname, writeDir));
}

main();
