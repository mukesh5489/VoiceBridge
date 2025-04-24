from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import pytesseract
from PIL import Image
import os
import io
import numpy as np
import cv2
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure Tesseract executable path if needed
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Global variable for video capture
camera = cv2.VideoCapture(0)

# MySQL configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'face_recognition'
}

def init_db():
    """Initialize the database."""
    try:
        temp_config = MYSQL_CONFIG.copy()
        temp_config.pop('database')
        conn = mysql.connector.connect(**temp_config)
        c = conn.cursor()
        
        c.execute("CREATE DATABASE IF NOT EXISTS face_recognition")
        conn.commit()
        conn.close()
        
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        c = conn.cursor()
        
        c.execute('''CREATE TABLE IF NOT EXISTS faces
                     (id INT AUTO_INCREMENT PRIMARY KEY,
                     name VARCHAR(255),
                     image_path VARCHAR(255),
                     timestamp DATETIME)''')
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/ocr', methods=['POST'])
def ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Open the image file
        img = Image.open(file.stream)
        
        # OpenCV format for preprocessing
        img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        # Preprocess image
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        # Perform OCR
        text = pytesseract.image_to_string(processed)
        return jsonify({'text': text}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def gen_frames():
    """Generate video frames from the camera."""
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            # Encode the frame in JPEG format
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            # Yield the frame as a byte stream
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/capture', methods=['POST'])
def capture_image():
    """Capture an image from the video feed."""
    success, frame = camera.read()
    if not success:
        return jsonify({'error': 'Failed to capture image'}), 500

    # Save the captured image
    image_path = os.path.join('static', 'captured_image.jpg')
    cv2.imwrite(image_path, frame)
    return jsonify({'message': 'Image captured successfully', 'image_path': image_path}), 200

@app.route('/api/save_face', methods=['POST'])
def save_face():
    if 'face_image' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['face_image']
    name = request.form.get('name')
    
    if not name or file.filename == '':
        return jsonify({'error': 'Invalid request'}), 400

    try:
        os.makedirs('static/faces', exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.jpg"
        filepath = os.path.join('static/faces', filename)
        file.save(filepath)

        conn = mysql.connector.connect(**MYSQL_CONFIG)
        c = conn.cursor()
        c.execute("INSERT INTO faces (name, image_path, timestamp) VALUES (%s, %s, %s)",
                 (name, filepath, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        
        return jsonify({
            'message': 'Face saved successfully',
            'image_path': filepath
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

@app.route('/api/recognize_face', methods=['POST'])
def recognize_face():
    if 'face_image' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['face_image']
    
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        c = conn.cursor()
        c.execute("SELECT name, image_path FROM faces")
        known_faces = c.fetchall()
        
        file_bytes = np.frombuffer(file.read(), np.uint8)
        uploaded_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        gray_uploaded = cv2.cvtColor(uploaded_img, cv2.COLOR_BGR2GRAY)
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        for name, image_path in known_faces:
            if os.path.exists(image_path):
                known_img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
                result = cv2.matchTemplate(gray_uploaded, known_img, cv2.TM_CCOEFF_NORMED)
                _, max_val, _, _ = cv2.minMaxLoc(result)
                if max_val > 0.6:
                    return jsonify({
                        'recognized': True,
                        'name': f"Recognized: {name} in front of you"
                    })
        
        return jsonify({'recognized': False})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

# Initialize the database
init_db()

# Test camera functionality
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Cannot access the camera")
else:
    print("Camera is working")
cap.release()

if __name__ == '__main__':
    try:
        app.run(debug=True, port=5000)
    finally:
        camera.release()
        cv2.destroyAllWindows()
        import os
        os._exit(0)
