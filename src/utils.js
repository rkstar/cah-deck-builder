import fs from "fs";
import readline from "readline";

export const availableSets = (inputFile) => {
  return new Promise((resolve) => {
    const setNames = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(inputFile),
    });
    rl.on("line", (line) => setNames.push(line));
    rl.on("close", () => resolve(setNames));
  });
};

export const generateAvailableSets = (setNames, writeFile) => {
  fs.writeFileSync(writeFile, setNames.join("\n"));
};
