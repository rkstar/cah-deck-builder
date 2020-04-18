import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import inquirer from "inquirer";

import {generateSourceFiles, mergeSourceFiles} from "./src/csv-generator.js";
import {availableSets} from "./src/utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    const prompts = await generateSourceFiles("prompt", promptsFile, sourceDir);
    const responses = await generateSourceFiles(
      "response",
      responsesFile,
      sourceDir
    );
    console.log("master list completed.");
  }

  // const {writeNewFiles} = await inquirer.prompt([
  //   {
  //     type: 'confirm',
  //     name: 'writeNewFiles',
  //     message: 'Do you wish to create a playing deck now?',
  //     choices: ['yes', 'no'],
  //   }
  // ])

  // const {selectedSets} = await inquirer.prompt([
  //   {
  //     type: 'checkbox',
  //     name: 'selectedSets',
  //     message: 'Which set(s) would you like to play with today?',
  //     choices: async () => await availableSets(promptsFile),
  //   }
  // ])

  // const {writeDir} = await inquirer.prompt([
  //   {
  //     type: 'input',
  //     name: 'writeDir',
  //     message: 'Where would you like the prompt/response csv files written?',
  //     default: './',
  //   }
  // ])

  // mergeSourceFiles(selectedSets, sourceDir, path.resolve(__dirname, writeDir))
}

main();
