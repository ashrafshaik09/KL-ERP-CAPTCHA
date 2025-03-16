const CONFIG = {
  WEBAPP_URL: chrome.runtime.getManifest().env.WEBAPP_URL,
  SECRET_TOKEN: chrome.runtime.getManifest().env.SECRET_TOKEN,
  DEBUG: false,
  ENABLE_DATA_COLLECTION: true,
  COLLECT_ALL_CAPTCHAS: true,
  MAX_OCR_RETRIES: 2,
  TESSERACT_OPTIONS: {
    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    langPath: chrome.runtime.getManifest().env.LANG_PATH
  },

  SUCCESS_URLS: [
    'https://newerp.kluniversity.in/index.php?r=site%2Findexindi',
    'https://newerp.kluniversity.in/index.php?r=site%2Findexparent'
  ],

  PENDING_STORAGE_KEY: 'pendingCaptchaSubmissions'
};

const processedCaptchas = new Set();
let currentCaptchaData = { imageData: null, prediction: null, timestamp: null };
let lastProcessedCaptchaUrl = null;
let ocrRetryCount = 0;
let isLoggedIn = false;

function isSuccessUrl(url) {
  return CONFIG.SUCCESS_URLS.some(successUrl => url.includes(successUrl));
}

function storePendingSubmission(imageData, captchaText, isCorrected) {
  try {
    const pendingSubmission = {
      imageData,
      captchaText,
      isCorrected,
      timestamp: Date.now()
    };

    sessionStorage.setItem(CONFIG.PENDING_STORAGE_KEY, JSON.stringify(pendingSubmission));
    
    if (CONFIG.DEBUG) console.log(`Stored pending CAPTCHA submission: ${captchaText}`);
  } catch (error) {
    console.error('Error storing pending submission:', error);
  }
}

function processPendingSubmissions() {
  try {
    const pendingSubmissionJson = sessionStorage.getItem(CONFIG.PENDING_STORAGE_KEY);
    if (!pendingSubmissionJson) return;
    
    const pendingSubmission = JSON.parse(pendingSubmissionJson);
    
    const isRecent = Date.now() - pendingSubmission.timestamp < 30000;
    
    if (isRecent) {
      if (CONFIG.DEBUG) console.log(`Processing pending CAPTCHA submission after successful login: ${pendingSubmission.captchaText}`);
      
      
      sendCaptchaData(
        pendingSubmission.imageData, 
        pendingSubmission.captchaText, 
        pendingSubmission.isCorrected
      );
    } else {
      if (CONFIG.DEBUG) console.log('Discarding old pending submission');
    }
    
    sessionStorage.removeItem(CONFIG.PENDING_STORAGE_KEY);
  } catch (error) {
    console.error('Error processing pending submissions:', error);
  }
}

function sendCaptchaData(imageData, captchaText, isCorrected) {
  if (!CONFIG.ENABLE_DATA_COLLECTION) return;
  if (!isCorrected && !CONFIG.COLLECT_ALL_CAPTCHAS) return;
  if (!imageData || !captchaText) return;
  
  const imageHash = btoa(captchaText).substring(0, 10);
  const submissionKey = `${imageHash}_${captchaText}`;
  
  if (processedCaptchas.has(submissionKey)) {
    if (CONFIG.DEBUG) console.log(`Already submitted CAPTCHA: ${captchaText}`);
    return;
  }
  
  processedCaptchas.add(submissionKey);
  
  if (CONFIG.DEBUG) {
    console.log(`Sending CAPTCHA data (${isCorrected ? 'corrected' : 'original'}): ${captchaText}`);
  }
  
  const formData = new FormData();
  formData.append('token', CONFIG.SECRET_TOKEN);
  formData.append('captchaText', captchaText);
  formData.append('imageHash', imageHash);
  formData.append('imageData', imageData);
  formData.append('isCorrected', isCorrected ? 'true' : 'false');
  
  fetch(CONFIG.WEBAPP_URL, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  })
  .then(() => CONFIG.DEBUG && console.log("CAPTCHA data sent"))
  .catch(error => console.error("Error sending CAPTCHA data:", error));
}

function handleCaptchaKeydown(event) {
  if (event.key === 'Enter') {
    queueCaptchaSubmission(event.target.value);
  }
}

function handleFormSubmit() {
  const captchaInput = document.querySelector("#loginform-captcha");
  if (captchaInput) {
    queueCaptchaSubmission(captchaInput.value);
  }
}

function queueCaptchaSubmission(value) {
  if (currentCaptchaData.imageData && value.trim()) {
    const isCorrected = currentCaptchaData.prediction !== value;
    
    // Store for processing after successful login
    storePendingSubmission(currentCaptchaData.imageData, value, isCorrected);
    
    if (CONFIG.DEBUG) {
      console.log(`Queued CAPTCHA submission: ${value} (waiting for login success)`);
    }
  }
}

function setupCaptchaDataCollection(captchaInput) {
  const loginForm = captchaInput.closest('form');
  if (!loginForm) return;
  
  // Remove any existing event listeners
  if (captchaInput._hasEventListeners) {
    captchaInput.removeEventListener('keydown', handleCaptchaKeydown);
    loginForm.removeEventListener('submit', handleFormSubmit);
  }
  
  // Add event listeners
  captchaInput.addEventListener('keydown', handleCaptchaKeydown);
  loginForm.addEventListener('submit', handleFormSubmit);
  captchaInput._hasEventListeners = true;
}

function preprocessImage(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      
      // Apply thresholding for better letter recognition
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg > 120 ? 255 : 0;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = URL.createObjectURL(blob);
  });
}

function performOCR(preprocessedImage, captchaInput) {
  const options = ocrRetryCount > 0 ? 
    { tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' } : 
    CONFIG.TESSERACT_OPTIONS;

  Tesseract.recognize(preprocessedImage, "eng", options)
    .then(({ data: { text } }) => {
      const cleanedText = text.replace(/[^a-zA-Z]/g, '').trim();
      if (CONFIG.DEBUG) console.log(`OCR ${ocrRetryCount > 0 ? 'Retry ' : ''}Result: ${cleanedText}`);
      
      currentCaptchaData.prediction = cleanedText;
      captchaInput.value = cleanedText;
      
      const inputEvent = new Event("input", { bubbles: true });
      captchaInput.dispatchEvent(inputEvent);
      
      setupCaptchaDataCollection(captchaInput);
    })
    .catch(error => {
      console.error("OCR Error:", error);
      
      if (ocrRetryCount < CONFIG.MAX_OCR_RETRIES) {
        ocrRetryCount++;
        setTimeout(() => performOCR(preprocessedImage, captchaInput), 500);
      } else {
        console.log("OCR failed after retries. Manual entry required.");
        captchaInput.focus();
      }
    });
}

function processCaptcha() {
  const captchaImg = document.querySelector("#loginform-captcha-image");
  const captchaInput = document.querySelector("#loginform-captcha");

  if (!captchaImg || !captchaInput) return;
  if (lastProcessedCaptchaUrl === captchaImg.src) return;

  lastProcessedCaptchaUrl = captchaImg.src;
  currentCaptchaData = { imageData: null, prediction: null, timestamp: null };
  ocrRetryCount = 0;

  fetch(captchaImg.src)
    .then(response => response.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function() {
        currentCaptchaData.imageData = reader.result;
        currentCaptchaData.timestamp = Date.now();
        
        preprocessImage(blob).then(preprocessedImage => {
          performOCR(preprocessedImage, captchaInput);
        });
      };
    })
    .catch(() => captchaInput.focus());
}

function observeCaptchaRefresh() {
  const captchaImg = document.querySelector("#loginform-captcha-image");
  if (!captchaImg) return;

  if (captchaImg._refreshObserver) {
    captchaImg._refreshObserver.disconnect();
  }

  const observer = new MutationObserver(() => {
    console.log("CAPTCHA refreshed");
    processCaptcha();
  });

  observer.observe(captchaImg, {
    attributes: true,
    attributeFilter: ["src"]
  });

  captchaImg._refreshObserver = observer;
}

function startCaptchaObserver() {
  if (window._pageObserver) {
    window._pageObserver.disconnect();
  }
  
  const observer = new MutationObserver(() => {
    const captchaImg = document.querySelector("#loginform-captcha-image");
    const captchaInput = document.querySelector("#loginform-captcha");

    if (captchaImg && captchaInput) {
      if (lastProcessedCaptchaUrl !== captchaImg.src) {
        processCaptcha();
        observeCaptchaRefresh();
      }
    } else {
      lastProcessedCaptchaUrl = null;
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window._pageObserver = observer;

  const captchaImg = document.querySelector("#loginform-captcha-image");
  const captchaInput = document.querySelector("#loginform-captcha");
  
  if (captchaImg && captchaInput) {
    processCaptcha();
    observeCaptchaRefresh();
  }
}

function checkForSuccessfulLogin() {
  const currentUrl = window.location.href;
  
  if (isSuccessUrl(currentUrl) && !isLoggedIn) {
    isLoggedIn = true;
    if (CONFIG.DEBUG) console.log('Login successful, processing pending CAPTCHA submissions');
    processPendingSubmissions();
  } else if (!isSuccessUrl(currentUrl)) {
    isLoggedIn = false;
  }
}

function initialize() {
  // Process any pending submissions from previous login attempts
  checkForSuccessfulLogin();
  
  // Start observing for CAPTCHA elements
  startCaptchaObserver();
  
  // Listen for URL changes to detect successful login
  window.addEventListener('popstate', checkForSuccessfulLogin);
}

// Initialize extension
initialize();
window.addEventListener('load', initialize);
window.addEventListener('DOMContentLoaded', initialize);
