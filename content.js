// Function to preprocess the image
function preprocessImage(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);

      // Apply grayscale and thresholding
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg > 128 ? 255 : 0; // Thresholding
      }
      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL());
    };
    img.src = URL.createObjectURL(blob);
  });
}

// Function to process the CAPTCHA
function processCaptcha() {
  const captchaImg = document.querySelector("#loginform-captcha-image");
  const captchaInput = document.querySelector("#loginform-captcha");

  if (!captchaImg || !captchaInput) {
    console.error("CAPTCHA elements not found");
    return;
  }

  // Fetch the CAPTCHA image
  fetch(captchaImg.src)
    .then((response) => response.blob())
    .then((blob) => {
      preprocessImage(blob).then((preprocessedImage) => {
        // Perform OCR using Tesseract.js
        Tesseract.recognize(preprocessedImage, "eng")
          .then(({ data: { text } }) => {
            console.log("OCR Result:", text);

            // Autofill the CAPTCHA input field
            captchaInput.value = text.trim();

            // Trigger an input event to ensure the form recognizes the change
            const inputEvent = new Event("input", { bubbles: true });
            captchaInput.dispatchEvent(inputEvent);
          })
          .catch((error) => {
            console.error("OCR Error:", error);
          });
      });
    })
    .catch((error) => {
      console.error("Failed to fetch CAPTCHA image:", error);
    });
}

// Function to observe CAPTCHA refresh
function observeCaptchaRefresh() {
  const captchaImg = document.querySelector("#loginform-captcha-image");

  if (!captchaImg) {
    console.error("CAPTCHA image not found for refresh observation");
    return;
  }

  const observer = new MutationObserver(() => {
    console.log("CAPTCHA refreshed");
    processCaptcha();
  });

  observer.observe(captchaImg, {
    attributes: true,
    attributeFilter: ["src"], // Monitor only the 'src' attribute
  });
}

// Use MutationObserver to detect CAPTCHA elements
const observer = new MutationObserver(() => {
  const captchaImg = document.querySelector("#loginform-captcha-image");
  const captchaInput = document.querySelector("#loginform-captcha");

  if (captchaImg && captchaInput) {
    console.log("CAPTCHA elements found");
    observer.disconnect(); // Stop observing once elements are found
    processCaptcha(); // Process the CAPTCHA
    observeCaptchaRefresh(); // Handle CAPTCHA refresh
  }
});

// Observe the body for changes
observer.observe(document.body, { childList: true, subtree: true });
