import sys
from core.intent_detector import detect_intent  # pyre-ignore

def main():
    print("=== Intent Detector Test ===")
    print("Type a phrase to test if it's considered a 'command' or 'question'.")
    print("Type 'exit' or 'quit' to quit.\n")
    
    while True:
        try:
            text = input("Enter phrase: ").strip()
            if text.lower() in ['exit', 'quit']:
                break
                
            intent = detect_intent(text)
            print(f"-> Detected Intent: [{intent.upper()}]\n")
            
        except KeyboardInterrupt:
            break

if __name__ == "__main__":
    main()
