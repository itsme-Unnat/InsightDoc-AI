import pdfParse from 'pdf-parse';

/**
 * Extracts raw text and metadata from a PDF buffer.
 * @param {Buffer} dataBuffer - Binary buffer of the uploaded PDF
 * @returns {Promise<{ text: string, numPages: number, info: Object }>}
 */
export const extractTextFromPDF = async (dataBuffer) => {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid PDF data buffer provided for extraction');
  }

  try {
    const data = await pdfParse(dataBuffer);

    const extractedText = (data.text || '').trim();
    const numPages = data.numpages || 1;

    if (!extractedText || extractedText.length < 10) {
      console.warn('⚠️ [PDF Service] Very little text extracted. PDF may be image-only/scanned.');
    }

    return {
      text: extractedText,
      numPages,
      info: data.info || {},
      metadata: data.metadata || {},
    };
  } catch (error) {
    console.error('❌ [PDF Service] Error parsing PDF buffer:', error.message);
    throw new Error(`Failed to parse PDF document: ${error.message}`);
  }
};
