# VoiceBridge - AI Text-to-Speech for Visually Impaired

VoiceBridge is an AI-powered text-to-speech system designed to empower visually impaired individuals by converting text from documents, images, or live camera feeds into expressive voice output. This project combines OCR (Optical Character Recognition) and TTS (Text-to-Speech) technologies to enhance accessibility and independence.

## 🌟 Features

- **📷 OCR Integration**: Extracts text from scanned images or live camera input.
- **🗣️ Text-to-Speech**: Converts text into natural-sounding speech using the Web Speech API.
- **🎛️ Voice Modulation**: Allows customization of pitch, speed, and voice type.
- **🌐 Multilingual Support**: Supports multiple languages for diverse users.
- **📄 File Upload**: Reads text from uploaded documents (PDF, DOCX, TXT, etc.).
- **📸 Live Camera Scanner**: Captures text from physical documents in real-time.

## 🛠️ Technologies Used

### Frontend:
- **HTML, CSS, JavaScript**: For building the user interface.
- **Web Speech API**: For text-to-speech functionality.

### Backend:
- **Python (Flask Framework)**: For handling API requests and OCR processing.
- **OCR**: Implemented using `pytesseract` and `OpenCV`.

### Libraries:
- `Flask`
- `flask-cors`
- `pytesseract`
- `Pillow`
- `opencv-python`
- `numpy`

## 📂 Project Structure
├── app.py # Flask backend for OCR and API endpoints ├── app.js # Frontend logic for text-to-speech and UI interactions ├── ocr.js # Handles live camera OCR and image processing ├── index.html # Main HTML file for the user interface ├── style.css # Styling for the application ├── requirements.txt # Python dependencies ├── static/ # Directory for static files (e.g., captured images) └── templates/ # HTML templates

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js (optional, for frontend development)
- Tesseract OCR installed on your system
  - [Download Tesseract](https://github.com/tesseract-ocr/tesseract)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mukesh5489/sus_hacksgit
   cd voicebridge
2.Install Python dependencies:
pip install -r requirements.txt

3.Install Tesseract OCR:

On Windows: Download and install from here.
On Linux: Use your package manager (e.g., sudo apt install tesseract-ocr).

4.Run the Flask server:
python app.py
Open the application in your browser:

Navigate to http://127.0.0.1:5000.
