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

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert('Speech Recognition is not supported in this browser. Please use Google Chrome.');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    const commands = {
        'start speaking': () => document.getElementById('play-btn').click(),
        'stop': () => document.getElementById('stop-btn').click(),
        'reset': () => document.getElementById('reset-btn').click(),
        'upload': () => document.getElementById('file-input').click(),// button error enter the file name manually by example 
        'live': () => document.getElementById('capture-btn').click(),
        'find': () => document.getElementById('recognize-btn').click(),
    };

    const grammar = `#JSGF V1.0; grammar commands; public <command> = 
    speak | start speaking | stop | halt | reset | clear | upload | live | capture | search | find | 
    begin speaking | pause | resume | restart | analyze | process;`;
    const recognition = new SpeechRecognition();
    const speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);

    recognition.grammars = speechRecognitionList;
    recognition.lang = 'en-US'; 
    recognition.interimResults = false; 
    recognition.continuous = true; 
    recognition.maxAlternatives = 5; 
    let currentMode = 'default'; 
    recognition.addEventListener('result', (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        const matchedCommand = Object.keys(commands).find(command => transcript === command);

        if (!matchedCommand) {
            console.log('Unrecognized command:', transcript);
        }

        const confidence = event.results[event.results.length - 1][0].confidence;
        const userConfirmed = confirm(`Did you say: "${transcript}"? (Confidence: ${Math.round(confidence * 100)}%)`);
        if (userConfirmed) {
            if (matchedCommand) {
                commands[matchedCommand]();
            } else {
                alert('Command not recognized.');
            }
        }
    });

    recognition.addEventListener('end', () => {
        if (startVoiceCommandsBtn.textContent === 'Stop Voice Commands') {
            recognition.start(); 
        }
    });
    recognition.addEventListener('start', () => {
        console.log('Speech recognition started');
    });

    recognition.addEventListener('error', (event) => {
        console.error('Speech recognition error:', event.error);
        alert('Speech recognition error: ' + event.error);
    });

    // Start/Stop Recognition
    const startVoiceCommandsBtn = document.getElementById('start-voice-commands');

    startVoiceCommandsBtn.addEventListener('click', () => {
        if (startVoiceCommandsBtn.textContent === 'Start Voice Commands') {
            recognition.start();
            startVoiceCommandsBtn.textContent = 'Stop Voice Commands';
        } else {
            recognition.stop();
            startVoiceCommandsBtn.textContent = 'Start Voice Commands';
        }
    });

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
