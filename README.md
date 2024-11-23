# CAPTCHA Autofill Extension

This project is an extension/add-on for browsers, designed to automatically fill in the CAPTCHA field on the KL ERP website. It uses Tesseract.js for Optical Character Recognition (OCR) to read CAPTCHA images and fill in the corresponding input fields. Hope it saves atleast a few keys clicks and taps, and few seconds of the Life too :)

## Features

- Automatically detects and processes CAPTCHA images on the KL ERP login page.
- Uses Tesseract.js to perform OCR on CAPTCHA images.
- Autofills the CAPTCHA input field with the recognized text.
- Observes CAPTCHA image changes and reprocesses them as needed.

## Installation

1. Clone the repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you cloned the repository.

## Usage

1. Navigate to the KL ERP login page.
2. The extension will automatically detect and process the CAPTCHA image.
3. The recognized text will be autofilled into the CAPTCHA input field.

## Troubleshoot

1. This is a pre-trained model from Tesseract, so it is not 100% accurate.
2. If wrongly predicted, you can click on the captcha image to refresh, or, manually edit the few letters.
3. If, by chance of no visible functioning of the extension/add-on, try to refresh the webpage.
4. You can also check the console through 'inspect' option to see logs.


## Files

- `content.js`: Contains the logic for processing CAPTCHA images and performing OCR.
- `background.js`: Listens for messages from the extension's popup or other parts of the extension and forwards them to the content script.
- `manifest.json`: Defines the extension's metadata, permissions, and scripts to be loaded.
- `icon.png`: The icon for the extension.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## Contact

For any questions or support or improvements, lets connect to discuss.
