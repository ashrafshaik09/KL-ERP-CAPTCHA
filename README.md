# CAPTCHA Autofill Extension

This project is a Chrome extension designed to automatically fill in CAPTCHA fields on the KL ERP website. It uses Tesseract.js for Optical Character Recognition (OCR) to read CAPTCHA images and fill in the corresponding input fields.

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

## Files

- `content.js`: Contains the logic for processing CAPTCHA images and performing OCR.
- `background.js`: Listens for messages from the extension's popup or other parts of the extension and forwards them to the content script.
- `manifest.json`: Defines the extension's metadata, permissions, and scripts to be loaded.
- `icon.png`: The icon for the extension.

## Dependencies

- [Tesseract.js](https://github.com/naptha/tesseract.js): A JavaScript library for OCR.

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or improvements.

## Contact

For any questions or support, please contact the project maintainer.
