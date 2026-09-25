# BPG Converter

A modern, desktop-based GUI tool for converting images to the Better Portable Graphics (BPG) format and decoding BPG back to standard formats (PNG/JPEG). Built with [Electron](https://www.electronjs.org/).

## Features
- **Bidirectional Conversion**:
  - Convert standard images (`.png`, `.jpg`, `.jpeg`, `.webp`) to `.bpg`.
  - Decode `.bpg` images back to `.png` (lossless) or `.jpg`.
- **Custom Output Folder**: Choose to save next to the original files or in any directory of your choice.
- **Drag & Drop Interface**: Easily convert single images or batches by dropping them into the window.
- **Batch Processing**: Convert multiple images at once with real-time logs and status indicators.
- **Advanced Controls**: Fine-tune quality (0–51), compression levels (1–9), and select encoder (`x265` or `JCT-VC`).
- **Real-time Preview**: Fast canvas preview powered by the WebAssembly/JavaScript `bpgdec` decoder.
- **Cross-Platform**: Native builds for Windows, macOS (Universal: Apple Silicon & Intel) and Linux (.deb, .rpm, .AppImage).

---

## Installation & Running Releases

### Windows (Microsoft Defender SmartScreen)
Since this is an open-source community release without an expensive corporate Code Signing Certificate:
1. Download the latest installer (`.exe`) from [Releases](https://github.com/DaveMex/bpg-converter-app/releases).
2. If Windows SmartScreen displays **"Windows protected your PC"** / *"Windows protegió su PC"*:
   - Click **"More info"** (*"Más información"*).
   - Click **"Run anyway"** (*"Ejecutar de todas formas"*).
3. Follow the installation wizard.

### macOS (Apple Silicon & Intel)
The macOS DMG is packaged as a **Universal Binary** with ad-hoc signing. Because it is not notarized through a paid Apple Developer subscription:
1. Download the `.dmg` file and drag **BPG Converter** to your **Applications** folder.
2. If macOS blocks opening with **"BPG Converter cannot be opened because Apple cannot check it for malicious software"**:
   - **Method 1 (GUI)**: Go to **Finder** > **Applications**, **right-click (or Control-click)** on *BPG Converter*, and select **Open**. Then click **Open** in the dialog. (You only need to do this once).
   - **Method 2 (Terminal)**: Open Terminal and run:
     ```bash
     xattr -cr /Applications/BPG\ Converter.app
     ```

### Linux (.deb, .rpm, .AppImage)
Choose the package for your distribution:
- **Debian / Ubuntu / Mint / Pop!_OS** (`.deb`):
  ```bash
  sudo dpkg -i bpg-converter-app_*_amd64.deb
  sudo apt-get install -f # (if missing dependencies)
  ```
- **Fedora / RHEL / openSUSE** (`.rpm`):
  ```bash
  sudo rpm -i bpg-converter-app-*.x86_64.rpm
  ```
- **Universal AppImage** (`.AppImage`):
  ```bash
  chmod +x bpg-converter-app-*.AppImage
  ./bpg-converter-app-*.AppImage
  ```
  *(Note: If the AppImage does not launch on Ubuntu 22.04+ or modern distributions, install `libfuse2`: `sudo apt install libfuse2`)*.

---

## Development & Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

### Setup
```bash
git clone https://github.com/DaveMex/bpg-converter-app.git
cd bpg-converter-app
npm install
```

### Running Locally
```bash
npm start
```

### Building for Production
```bash
# For Windows (.exe NSIS)
npm run dist:win

# For macOS (Universal: x64 + arm64 DMG)
npm run dist:mac

# For Linux (.deb, .rpm, .AppImage)
npm run dist:linux
```
The output files will be created in the `dist/` directory.

---

## Project Structure
- `src/`: Application source code (HTML, CSS, Renderer, Main & Preload scripts).
- `src/assets/`: Application icons and logos.
- `resources/bin/`: Platform-specific `bpgenc` binaries for Windows, macOS, and Linux.

## License
[ISC](LICENSE)
