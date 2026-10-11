/**
 * Text Chunking Engine for InsightDoc AI
 * Implements sliding-window semantic chunking with customizable token size & overlap.
 */

// Approximates token count (standard heuristic: ~4 characters per token in English)
export const estimateTokenCount = (text) => {
  if (!text) return 0;
  // Combine word count and character length heuristics
  const words = text.trim().split(/\s+/).length;
  const charTokens = Math.ceil(text.length / 4);
  return Math.max(words, charTokens);
};

/**
 * Splits text into overlapping chunks while respecting sentence & paragraph boundaries.
 * @param {string} fullText - The raw extracted text from the document
 * @param {Object} options - Chunking options
 * @param {number} options.targetTokens - Desired chunk size (default: 400)
 * @param {number} options.overlapTokens - Overlap between consecutive chunks (default: 50)
 * @param {number} options.pageNumber - Optional initial page number
 * @returns {Array<{ chunkIndex: number, text: string, tokenCount: number, pageNumber: number }>}
 */
export const chunkText = (fullText, options = {}) => {
  const {
    targetTokens = 400,
    overlapTokens = 50,
    pageNumber = 1,
  } = options;

  if (!fullText || typeof fullText !== 'string' || fullText.trim() === '') {
    return [];
  }

  // Normalize line breaks and remove excessive empty spaces
  const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Split by natural paragraph breaks first
  const paragraphs = cleanText.split(/\n\n+/);
  const units = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // If paragraph itself is too large, break down into sentences
    if (estimateTokenCount(trimmedPara) > targetTokens) {
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmedPara];
      for (const sent of sentences) {
        const trimmedSent = sent.trim();
        if (trimmedSent) units.push(trimmedSent);
      }
    } else {
      units.push(trimmedPara);
    }
  }

  const chunks = [];
  let currentUnits = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const unitTokens = estimateTokenCount(unit);

    // If adding unit exceeds target and we already have accumulated content
    if (currentTokenCount + unitTokens > targetTokens && currentUnits.length > 0) {
      const chunkContent = currentUnits.join('\n\n').trim();
      chunks.push({
        chunkIndex,
        text: chunkContent,
        tokenCount: estimateTokenCount(chunkContent),
        pageNumber,
      });
      chunkIndex++;

      // Compute overlap: keep the tail units that fit within overlapTokens
      const overlapUnits = [];
      let accumulatedOverlap = 0;
      for (let j = currentUnits.length - 1; j >= 0; j--) {
        const u = currentUnits[j];
        const uTokens = estimateTokenCount(u);
        if (accumulatedOverlap + uTokens <= overlapTokens) {
          overlapUnits.unshift(u);
          accumulatedOverlap += uTokens;
        } else {
          break;
        }
      }

      currentUnits = [...overlapUnits, unit];
      currentTokenCount = accumulatedOverlap + unitTokens;
    } else {
      currentUnits.push(unit);
      currentTokenCount += unitTokens;
    }
  }

  // Push remaining content as the final chunk
  if (currentUnits.length > 0) {
    const finalContent = currentUnits.join('\n\n').trim();
    if (finalContent.length > 0) {
      chunks.push({
        chunkIndex,
        text: finalContent,
        tokenCount: estimateTokenCount(finalContent),
        pageNumber,
      });
    }
  }

  return chunks;
};
