"""Intent Detection System for Jarvis."""

def detect_intent(text: str) -> str:
    """
    Determines whether the given text is a command or a question.
    Returns "command" or "question".
    """
    if not text or not isinstance(text, str):
        return "question"
        
    command_keywords = {
        "open", "launch", "run", "start", "play", "execute"
    }
    
    words = text.lower().split()
    for word in words:
        if word in command_keywords:
            return "command"
            
    return "question"
