JARVIS — AI DESKTOP ASSISTANT

Jarvis is a movie-style AI desktop assistant that combines a Python voice engine with a futuristic Electron + React dashboard.

The goal of this project is to build a production-grade AI assistant that runs locally and provides real-time visual interaction.

---

FEATURES

Voice Intelligence (Python)

* Wake word detection using Vosk
* Speech recognition
* Command execution system
* Context modes (Normal / Study / Coding)
* Modular command architecture

Desktop Dashboard (Electron + React)

* Iron-Man style futuristic UI
* Neon dark theme using Tailwind CSS
* Real-time microphone waveform animation
* Command feed showing what Jarvis heard
* System telemetry panel (CPU, RAM, Network)

Backend ↔ UI Integration

* WebSocket communication
* Real-time event streaming from Python to UI
* Live updates in dashboard

---

ARCHITECTURE

Jarvis Core (Python)

Wake Word Engine
Speech Recognition
Command System
Mode Manager
WebSocket Server

```
    ↓
```

Electron Desktop Shell

```
    ↓
```

React Dashboard

AI Core Animation
Waveform Visualization
Command Feed
System Stats

---

TECH STACK

Backend
Python
Vosk
SpeechRecognition
WebSockets
psutil

Frontend
Electron
React
Tailwind CSS
Web Audio API

---

PROJECT STRUCTURE

jarvis/

core/
commands/
wakeword/
voice/
websocket/

ui/
electron/
react/
components/

main.py

---

GETTING STARTED

1. Clone repository

git clone https://github.com/Keerthi7423/jarvis.git

cd jarvis

2. Install Python dependencies

pip install -r requirements.txt

3. Start Jarvis backend

python main.py

4. Start UI

cd ui
npm install
npm start

---

CONTRIBUTING

Contributions are welcome.

You can help by:

* Improving architecture
* Enhancing UI/UX
* Adding new voice commands
* Optimizing Python ↔ Electron communication
* Fixing bugs

Steps to contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

AUTHOR

Keerthi Kumar

GitHub
https://github.com/Keerthi7423

---

If you like this project, please give it a star ⭐
