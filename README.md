# JARVIS — AI Desktop Assistant

Jarvis is a **movie-style AI desktop assistant** combining a **Python voice engine** with a **futuristic Electron + React dashboard**.

The goal of this project is to build a **production-grade AI assistant** that runs locally, executes voice commands, automates workflows, and provides a **real-time visual interface**.

---

# 🚀 Features

## Voice Intelligence (Python)

* Wake word detection using **Vosk**
* Speech recognition
* Command execution system
* Context modes: **Normal / Study / Coding**
* Multi-step workflow automation
* Centralized error handling
* Proactive system monitoring

---

## Futuristic Desktop Dashboard

Built with **Electron + React + Tailwind CSS**

* Iron-Man style UI
* Neon dark theme
* Real-time microphone waveform
* Command feed panel
* System telemetry panel
  CPU usage
  RAM usage
  Network activity

---

## Automation & Intelligence

* Multi-step workflow commands
* Context aware modes
* Plugin architecture
* Event monitoring system

Example workflow:

User:
Jarvis prepare coding environment

Jarvis will automatically:

* Open VS Code
* Open terminal
* Load project workspace

---

# 🧩 System Architecture

```
                    +----------------------+
                    |     User Voice       |
                    +----------+-----------+
                               |
                               v
                     +-------------------+
                     | Wake Word Engine  |
                     |      (Vosk)       |
                     +---------+---------+
                               |
                               v
                     +-------------------+
                     | Speech Recognition|
                     +---------+---------+
                               |
                               v
                     +-------------------+
                     |   Command Router  |
                     +---------+---------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
+---------------+     +----------------+     +----------------+
| Workflow      |     | Mode Manager   |     | Plugin Loader  |
| Automation    |     | (study/coding) |     | (extensions)   |
+-------+-------+     +--------+-------+     +--------+-------+
        |                      |                      |
        +-----------+----------+----------+-----------+
                    |                     |
                    v                     v
           +---------------+     +-------------------+
           | Error Handler |     | Event Monitor     |
           | (Reliability) |     | (Proactive alerts)|
           +-------+-------+     +---------+---------+
                   |                       |
                   v                       v
            +--------------------------------------+
            |       WebSocket Communication        |
            +------------------+-------------------+
                               |
                               v
                   +-----------------------------+
                   |   Electron Desktop Shell    |
                   +-------------+---------------+
                                 |
                                 v
                   +-----------------------------+
                   |       React Dashboard       |
                   |                             |
                   |  AI Core Animation          |
                   |  Mic Waveform               |
                   |  Command Feed               |
                   |  System Stats Panel         |
                   +-----------------------------+
```

---

# 🔁 Command Processing Flow

```
User Voice
    |
    v
Wake Word Detected
    |
    v
Speech Recognition
    |
    v
Command Parsing
    |
    v
Is Command a Workflow?
    |            |
   Yes           No
    |             |
    v             v
Execute Steps   Execute Single Command
    |
    v
Send Result
    |
    v
Update Dashboard + Speak Response
```

---

# 🔄 Proactive Monitoring Flow

```
Event Monitor Thread
        |
        v
Check System Metrics
(CPU / RAM / Network)
        |
        v
Threshold Exceeded?
     |        |
    No       Yes
     |        |
     v        v
  Wait      Trigger Alert
               |
               v
        Send Notification
               |
               v
     Jarvis Speaks Warning
               |
               v
       Update Dashboard
```

---

# 🧩 Plugin System Flow

```
Jarvis Startup
      |
      v
Scan plugins/ directory
      |
      v
Load Plugin Modules
      |
      v
Call register() function
      |
      v
Add Plugin Commands
      |
      v
Command Router can execute plugin commands
```

---

# 🛠 Tech Stack

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

# 📂 Project Structure

```
jarvis/

core/
commands/
plugins/
wakeword/
voice/
websocket/

ui/
   electron/
   react/
   components/

main.py
```

---

# ⚡ Getting Started

Clone repository

```
git clone https://github.com/Keerthi7423/jarvis.git
cd jarvis
```

Install Python dependencies

```
pip install -r requirements.txt
```

Run backend

```
python main.py
```

Run dashboard

```
cd ui
npm install
npm start
```

---

# 🤝 Contributing

Contributions are welcome.

You can help by:

* improving architecture
* adding plugins
* improving UI
* optimizing performance
* adding automation workflows

Steps:

1 Fork repository
2 Create feature branch
3 Submit Pull Request

---

# 📌 Roadmap

Upcoming features

* AI chat mode
* smart home automation
* mobile companion app
* advanced workflow automation
* cloud integration

---

# 👨‍💻 Author

Keerthi Kumar

GitHub
https://github.com/Keerthi7423

---

⭐ If you like this project, consider giving it a star.
