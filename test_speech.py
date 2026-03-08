import pyttsx3  # pyre-ignore # type: ignore
import time

def test_speech():
    print("Initializing pyttsx3...")
    try:
        engine = pyttsx3.init()
        print("Engine initialized.")
        engine.setProperty('rate', 150)
        voices = engine.getProperty('voices')
        print(f"Number of voices: {len(voices)}")
        text = "Hello Keerthi, testing jarvis voice systems."
        print(f"Attempting to say: {text}")
        engine.say(text)
        engine.runAndWait()
        print("Speech completed.")
    except Exception as e:
        print(f"Speech test failed: {e}")

if __name__ == "__main__":
    test_speech()
