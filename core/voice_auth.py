import os
import pickle
import speech_recognition as sr  # pyre-ignore
from core.logger import get_logger, log_error  # pyre-ignore
from voice.speaker import speak  # pyre-ignore

logger = get_logger("jarvis.voice_auth")

PROFILE_PATH = "data/voice_profile.pkl"
AUTH_THRESHOLD = 0.5  # For simple dummy matching

def _extract_embedding(audio_data: sr.AudioData) -> list[float]:
    """
    Extracts a dummy voice embedding.
    In a production system, use SpeechBrain, pyannote, or similar models.
    """
    raw_data = audio_data.get_raw_data()
    # Dummy logic: generate a 128-dimensional vector based on raw audio byte sum and length
    import math
    val = sum(raw_data) if raw_data else 0
    length = len(raw_data) if raw_data else 1
    
    # We'll use a deterministic approach to generate a dummy 'embedding' so it can pseudo-match
    # if the sample length/content is somewhat in the same ballpark, but realistically it's a mock.
    # To prevent random failures during tests, we will just return a simple normalized vector.
    v = [math.sin((val + i) / length) for i in range(128)]
    
    # normalize
    norm = sum(x*x for x in v) ** 0.5
    if norm > 0:
        v = [x/norm for x in v]
    return v

def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = sum(a * a for a in vec1) ** 0.5
    norm_b = sum(b * b for b in vec2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def create_voice_profile() -> bool:
    """Records a sample and saves the mock embedding."""
    logger.info("Starting voice profile creation...")
    speak("Please say a short phrase to create your voice profile.", mode="calm")
    
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source, duration=1.0)
            audio = recognizer.listen(source, timeout=5.0, phrase_time_limit=5.0)
            
        embedding = _extract_embedding(audio)
        
        os.makedirs(os.path.dirname(PROFILE_PATH), exist_ok=True)
        with open(PROFILE_PATH, "wb") as f:
            pickle.dump(embedding, f)
            
        speak("Voice profile successfully created and saved.", mode="calm")
        return True
    except Exception as exc:
        log_error(exc, "create_voice_profile")
        speak("Failed to create voice profile.", mode="calm")
        return False

def authenticate_voice() -> bool:
    """Authenticates the user using a short voice sample."""
    if not os.path.exists(PROFILE_PATH):
        logger.warning("No voice profile found. Proceeding as unauthenticated.")
        return False
        
    try:
        with open(PROFILE_PATH, "rb") as f:
            stored_embedding = pickle.load(f)
            
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            # Record short voice sample
            try:
                audio = recognizer.listen(source, timeout=3.0, phrase_time_limit=3.0)
            except sr.WaitTimeoutError:
                return False
            
        # Extract voice embedding
        current_embedding = _extract_embedding(audio)
        
        # Compare with stored embedding
        score = _cosine_similarity(stored_embedding, current_embedding)
        logger.info(f"Voice authentication similarity score: {score:.2f}")
        
        # If similarity score > threshold -> success
        if score > AUTH_THRESHOLD:
            return True
        return False
    except Exception as exc:
        log_error(exc, "authenticate_voice")
        return False
