import fs from "fs";
import readline from "readline";

import {
  PROMPT_CARD_COLOR,
  PROMPT_TEXT_COLOR,
  RESPONSE_CARD_COLOR,
  RESPONSE_TEXT_COLOR,
  generateCard,
  generateCardText,
} from "./cards.js";

const build = (inputFile, writeDir, cardType, yStart = 20, lineHeight = 18) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    output: process.stdout,
    terminal: false,
  });

  let idx = 0;
  rl.on("line", (line) => {
    const textColor =
      cardType === "prompt" ? PROMPT_TEXT_COLOR : RESPONSE_TEXT_COLOR;
    const cardColor =
      cardType === "prompt" ? PROMPT_CARD_COLOR : RESPONSE_CARD_COLOR;
    const lines = line.match(/.{1,19}(\s|$)/g);
    const output = generateCard(
      generateCardText(lines, yStart, lineHeight),
      cardColor,
      textColor
    );
    const filename = `${writeDir}/${cardType}-${idx}.svg`;
    fs.promises
      .writeFile(filename, output, "utf8")
      .then(() => console.log(filename, "written."))
      .catch((err) => console.error(err));
    idx++;
  });
};

export default build;
