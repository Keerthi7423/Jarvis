import sys
from core.voice_auth import create_voice_profile, authenticate_voice  # pyre-ignore

def main():
    print("=== Voice Authentication Test ===")
    print("1. Create a new voice profile")
    print("2. Test authentication")
    print("3. Exit")
    
    choice = input("\nSelect an option (1-3): ").strip()
    
    if choice == '1':
        print("\nGet ready to speak. We will record a 5-second sample.")
        input("Press Enter to start recording...")
        success = create_voice_profile()
        if success:
            print("\n✅ Profile created successfully! It is saved in data/voice_profile.pkl")
        else:
            print("\n❌ Failed to create profile.")
            
    elif choice == '2':
        print("\nGet ready to speak. We will record a short 3-second sample.")
        input("Press Enter to start recording...")
        success = authenticate_voice()
        if success:
            print("\n✅ Authentication SUCCESS! Voice recognized.")
        else:
            print("\n❌ Authentication FAILED! Voice not recognized or profile missing.")
            
    elif choice == '3':
        sys.exit(0)
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    main()
