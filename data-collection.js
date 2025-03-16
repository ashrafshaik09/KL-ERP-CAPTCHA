/**
 * Utility functions for CAPTCHA data collection
 */

// Status tracking for data collection
let dataCollectionStats = {
  captchasSent: 0,
  captchasCorrected: 0,
  lastSentTimestamp: null
};

/**
 * Check if a CAPTCHA image has already been processed
 * to avoid duplicate submissions
 */
function isProcessedCaptcha(imageHash) {
  const processedCaptchas = JSON.parse(localStorage.getItem('processedCaptchas') || '{}');
  return !!processedCaptchas[imageHash];
}

/**
 * Mark a CAPTCHA as processed
 */
function markCaptchaAsProcessed(imageHash) {
  const processedCaptchas = JSON.parse(localStorage.getItem('processedCaptchas') || '{}');
  processedCaptchas[imageHash] = Date.now();
  
  // Limit storage size by removing old entries if there are more than 50
  const keys = Object.keys(processedCaptchas);
  if (keys.length > 50) {
    const oldestKeys = keys.sort((a, b) => processedCaptchas[a] - processedCaptchas[b]).slice(0, keys.length - 50);
    oldestKeys.forEach(key => delete processedCaptchas[key]);
  }
  
  localStorage.setItem('processedCaptchas', JSON.stringify(processedCaptchas));
}

/**
 * Generate a hash for the image data
 */
function generateImageHash(imageData) {
  // Simple hash implementation - in a real app you'd use a proper hashing algorithm
  let hash = 0;
  if (!imageData) return hash.toString();
  
  const sample = imageData.slice(100, 1000); // Take a sample of the data
  for (let i = 0; i < sample.length; i += 10) {
    hash = ((hash << 5) - hash) + sample.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isProcessedCaptcha,
    markCaptchaAsProcessed,
    generateImageHash,
    dataCollectionStats
  };
}
