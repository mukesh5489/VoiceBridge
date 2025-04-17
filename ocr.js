document.addEventListener('DOMContentLoaded', () => {
    const cameraSection = document.getElementById('camera-section');
    const cameraFeed = document.getElementById('camera-feed');
    const captureBtn = document.getElementById('capture-btn');
    const textInput = document.getElementById('text-input');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Processing document...</p>
    `;
    cameraSection.appendChild(loadingIndicator);
    loadingIndicator.style.display = 'none';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraSection.style.display = 'none';
        return;
    }

    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            cameraFeed.srcObject = stream;
            cameraFeed.onloadedmetadata = () => {
                cameraFeed.play();
            };
        } catch (err) {
            console.error('Camera error:', err);
            cameraSection.style.display = 'none';
        }
    }

    async function captureImage() {
        try {
            loadingIndicator.style.display = 'flex';
            captureBtn.disabled = true;

            const canvas = document.createElement('canvas');
            canvas.width = cameraFeed.videoWidth;
            canvas.height = cameraFeed.videoHeight;
            const ctx = canvas.getContext('2d');

            ctx.filter = 'contrast(1.2) brightness(1.1) grayscale(0.2)';
            ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('file', blob, 'capture.jpg');

                try {
                    const response = await fetch('/ocr', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('OCR Result:', result);

                    if (result.text) {
                        textInput.value = result.text;
                        textInput.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        alert('No text could be extracted from the document');
                    }
                } catch (err) {
                    console.error('OCR processing error:', err);
                    alert('Error processing image: ' + err.message);
                } finally {
                    loadingIndicator.style.display = 'none';
                    captureBtn.disabled = false;
                }
            }, 'image/jpeg', 0.9);
        } catch (err) {
            console.error('Capture error:', err);
            loadingIndicator.style.display = 'none';
            captureBtn.disabled = false;
            alert('Error capturing image: ' + err.message);
        }
    }

    captureBtn.addEventListener('click', captureImage);
    initCamera();
});
