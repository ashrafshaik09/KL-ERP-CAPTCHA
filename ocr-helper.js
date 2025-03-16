/**
 * Helper functions to improve CAPTCHA recognition
 */

// Apply additional post-processing to improve OCR results for alphabetic CAPTCHAs
function postProcessOCRResult(text) {
  if (!text) return '';
  
  // Convert to uppercase for consistency
  let result = text.toUpperCase();
  
  // Remove all non-alphabetic characters
  result = result.replace(/[^A-Z]/g, '');
  
  // Common OCR corrections for alphabets
  const corrections = {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '5': 'S',
    '8': 'B',
    '$': 'S',
    '@': 'A',
    '#': 'H',
    '(': 'C',
    ')': 'D',
  };
  
  // Apply corrections
  for (const [incorrect, correct] of Object.entries(corrections)) {
    result = result.split(incorrect).join(correct);
  }
  
  return result;
}

// Additional image preprocessing techniques specifically for CAPTCHA
function enhanceCaptchaImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Dilate the image to connect broken letter parts
  const dilatedData = dilateImage(data, canvas.width, canvas.height);
  
  // Apply sharpening
  const sharpenedData = sharpenImage(dilatedData, canvas.width, canvas.height);
  
  // Apply the processed data back to the canvas
  for (let i = 0; i < data.length; i++) {
    data[i] = sharpenedData[i];
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Simple dilation algorithm to connect broken letter parts
function dilateImage(data, width, height) {
  // Create a copy of the original data
  const result = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i];
  }
  
  // Apply dilation
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // If any neighboring pixel is black, make this pixel black
      if (
        data[idx - 4] === 0 || // left
        data[idx + 4] === 0 || // right
        data[idx - width * 4] === 0 || // top
        data[idx + width * 4] === 0    // bottom
      ) {
        result[idx] = result[idx + 1] = result[idx + 2] = 0;
      }
    }
  }
  
  return result;
}

// Simple sharpening filter
function sharpenImage(data, width, height) {
  const result = new Uint8ClampedArray(data.length);
  
  // Copy the data
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i];
  }
  
  // Apply sharpening
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Apply a simple sharpening kernel
      const centerValue = data[idx];
      const surroundingAvg = (
        data[idx - 4] + // left
        data[idx + 4] + // right
        data[idx - width * 4] + // top
        data[idx + width * 4]   // bottom
      ) / 4;
      
      // Enhance the difference between the center and surrounding
      const newValue = Math.min(255, Math.max(0, 2 * centerValue - surroundingAvg));
      result[idx] = result[idx + 1] = result[idx + 2] = newValue;
    }
  }
  
  return result;
}

// Export the functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    postProcessOCRResult,
    enhanceCaptchaImage,
    dilateImage,
    sharpenImage
  };
}
