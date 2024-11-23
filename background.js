chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startCaptchaProcessing") {
      console.log("Received startCaptchaProcessing message");
  
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
  
        // Forward the message to the content script
        chrome.tabs.sendMessage(tabs[0].id, { action: "processCaptcha" }, (response) => {
          console.log("Message sent to content script:", response);
          sendResponse(response);
        });
      });
      return true; // Keeps the message channel open for async responses
    }
  });
  