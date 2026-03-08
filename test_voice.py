import pyttsx3  # pyre-ignore
engine = pyttsx3.init()
voices = engine.getProperty('voices')
for voice in voices:
    print(f"ID: {voice.id} | Name: {voice.name}")
engine.say("Good evening, Keerthi. Jarvis systems are now online.")
engine.runAndWait()
