const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', newTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
    themeIcon.className = initialTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    main.style.paddingBottom = '100px';

    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.body.scrollHeight;

        if (scrollPosition + windowHeight > documentHeight - 200) {
            footer.classList.add('visible');
        } else {
            footer.classList.remove('visible');
        }
    });

    const textInput = document.getElementById('text-input');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const voiceSelect = document.getElementById('voice-select');
    const speedControl = document.getElementById('speed-control');
    const pitchControl = document.getElementById('pitch-control');
    const speedValue = document.getElementById('speed-value');
    const pitchValue = document.getElementById('pitch-value');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const resetBtn = document.getElementById('reset-btn');

    let speech = new SpeechSynthesisUtterance();
    let voices = [];
    let isPlaying = false;

    function loadVoices() {
        voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-name', voice.name);
            option.setAttribute('data-lang', voice.lang);
            voiceSelect.appendChild(option);
        });

        const defaultVoice = voices.find(voice => voice.lang.includes('en'));
        if (defaultVoice) {
            speech.voice = defaultVoice;
            const option = voiceSelect.querySelector(`[data-name="${defaultVoice.name}"]`);
            if (option) option.selected = true;
        }
    }

    function setVoice() {
        const selectedOption = voiceSelect.selectedOptions[0];
        const selectedVoice = voices.find(voice =>
            voice.name === selectedOption.getAttribute('data-name') &&
            voice.lang === selectedOption.getAttribute('data-lang')
        );

        if (selectedVoice) {
            speech.voice = selectedVoice;
        }
    }

    function playText() {
        if (isPlaying) return;

        speech.text = textInput.value;
        if (!speech.text.trim()) {
            alert('Please enter some text to speak');
            return;
        }

        setVoice();
        speech.rate = parseFloat(speedControl.value);
        speech.pitch = parseFloat(pitchControl.value);

        window.speechSynthesis.speak(speech);
        isPlaying = true;

        speech.onend = () => {
            isPlaying = false;
            playBtn.textContent = 'Speak';
        };
        playBtn.textContent = 'Speaking...';
    }

    function pauseSpeech() {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            isPlaying = false;
            playBtn.textContent = 'Resume';
        }
    }

    function stopSpeech() {
        window.speechSynthesis.cancel();
        isPlaying = false;
        playBtn.textContent = 'Speak';
    }

    function updateSpeedValue() {
        speedValue.textContent = `${speedControl.value}x`;
    }

    function updatePitchValue() {
        pitchValue.textContent = pitchControl.value;
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/ocr', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.text) {
                textInput.value = result.text;
            } else if (result.error) {
                alert('OCR Error: ' + result.error);
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error processing file');
        }
    }

    function resetFields() {
        textInput.value = '';
        fileInput.value = '';
        speedControl.value = 1;
        pitchControl.value = 1;
        updateSpeedValue();
        updatePitchValue();
        window.speechSynthesis.cancel();
    }

    window.speechSynthesis.onvoiceschanged = loadVoices;
    playBtn.addEventListener('click', playText);
    pauseBtn.addEventListener('click', pauseSpeech);
    stopBtn.addEventListener('click', stopSpeech);
    voiceSelect.addEventListener('change', setVoice);
    speedControl.addEventListener('input', updateSpeedValue);
    pitchControl.addEventListener('input', updatePitchValue);
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileUpload);
    resetBtn.addEventListener('click', resetFields);

    loadVoices();
    updateSpeedValue();
    updatePitchValue();
});
