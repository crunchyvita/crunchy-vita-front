// Copy that still needs real product data is written with this marker in the message
// files. Anything containing it is hidden from visitors and structured data until filled in.
export const TO_COMPLETE = '[À COMPLÉTER';

export const isComplete = (text) => typeof text === 'string' && text.trim() !== '' && !text.includes(TO_COMPLETE);
