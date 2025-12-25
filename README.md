# BPG Converter

A modern, desktop-based GUI tool for converting images to the Better Portable Graphics (BPG) format. Built with [Electron](https://www.electronjs.org/).

## Features
- **Drag & Drop Interface**: Easily convert images by dropping them into the app.
- **Batch Processing**: Convert multiple images at once.
- **Advanced Controls**: Adjust quality (0-51), compression levels (1-9), and choose encoders (x265/JCT-VC).
- **Preview**: Real-time preview of converted BPG images using the `bpgdec.js` decoder.
- **Cross-Platform**: Designed for Windows, macOS, and Linux.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### Setup
1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/bpg-converter-app.git
    cd bpg-converter-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

### Development
To run the application in development mode:
```bash
npm start
```

### Building for Production
To create a standard executable installer (e.g., `.exe` for Windows):

```bash
# For Windows
npm run dist:win

# For Mac
npm run dist:mac

# For Linux
npm run dist:linux
```
The output files will be in the `dist/` directory.

## Project Structure
- `src/`: Source code (HTML, JS, CSS).
- `src/assets/`: Icons and images.
- `resources/bin/`: BPG binaries (bpgenc) for different platforms.

## License
[ISC](LICENSE)
