export const CARD = `<svg width="140" height="190" viewBox="0 0 140 190" xmlns="http://www.w3.org/2000/svg">
  <style> .text { font-weight: 600; font-size: 14px; font-family: helvetica neue; } </style>
  <rect width="100%" height="100%" fill="{fill}" />
  {text}
</svg>
`;
export const CARD_TEXT = `<text x="7" y="{ypos}" class="text" fill="{fill}">{text}</text>`;
export const PROMPT_CARD_COLOR = "#000";
export const PROMPT_TEXT_COLOR = "#fff";
export const RESPONSE_CARD_COLOR = "#fff";
export const RESPONSE_TEXT_COLOR = "#000";

export const generateCard = (
  text,
  cardColor = "#fff",
  textColor = "#000",
  height = "190",
  width = "140"
) =>
  CARD.replace(/{fill}/, cardColor)
    .replace(/{width}/, width)
    .replace(/{height}/, height)
    .replace(/{text}/, text);

export const generateCardText = (lines, startYPos, lineHeight) =>
  Array.isArray(lines)
    ? lines.map((ln, i) => cardText(ln, startYPos + i * lineHeight)).join("")
    : cardText(lines, startYPos);

const cardText = (text, ypos) =>
  CARD_TEXT.replace(/{text}/, text).replace(/{ypos}/, ypos);
