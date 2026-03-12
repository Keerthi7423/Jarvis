"""WhatsApp messaging automation for Jarvis using pywhatkit.
"""

import os
import json
import pywhatkit # pyre-ignore
from typing import Optional, Tuple
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.whatsapp")

CONTACTS_FILE = os.path.join("data", "contacts.json")

def load_contacts() -> dict:
    """Load contacts from JSON file."""
    if not os.path.exists(CONTACTS_FILE):
        return {}
    try:
        with open(CONTACTS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load contacts: {e}")
        return {}

def find_contact(name: str) -> Optional[str]:
    """Look up a contact phone number by name."""
    contacts = load_contacts()
    name = name.lower().strip()
    return contacts.get(name)

def send_whatsapp_message(contact_name: str, message: str) -> Tuple[bool, str]:
    """Send a WhatsApp message instantly."""
    phone_number = find_contact(contact_name)
    if not phone_number:
        return False, f"Contact {contact_name} not found in my database."
    
    try:
        # sendwhatmsg_instantly opens the browser and sends the message
        pywhatkit.sendwhatmsg_instantly(phone_number, message, wait_time=15, tab_close=True)
        logger.info(f"WhatsApp message sent to {contact_name} ({phone_number})")
        return True, f"Message sent to {contact_name}."
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return False, f"An error occurred while sending the message to {contact_name}."

def open_whatsapp_chat(contact_name: str) -> Tuple[bool, str]:
    """Open WhatsApp Web chat for a specific contact."""
    phone_number = find_contact(contact_name)
    if not phone_number:
        return False, f"Contact {contact_name} not found."
    
    try:
        url = f"https://web.whatsapp.com/send?phone={phone_number}"
        import webbrowser
        webbrowser.open(url)
        return True, f"Opening chat with {contact_name}."
    except Exception as e:
        logger.error(f"Failed to open WhatsApp chat: {e}")
        return False, f"Could not open chat with {contact_name}."

def execute_whatsapp_command(text: str, listen_func, speak_func) -> Tuple[bool, Optional[str]]:
    """
    Handle WhatsApp-related voice commands.
    
    Args:
        text: The recognized speech text.
        listen_func: Function to get next user interaction.
        speak_func: Function to provide voice feedback.
        
    Returns:
        (handled, response_msg)
    """
    lowered = text.lower().strip()
    
    # Pattern: "send whatsapp message to [name]"
    if "whatsapp message to" in lowered:
        parts = lowered.split("whatsapp message to")
        if len(parts) > 1:
            contact_name = parts[1].strip()
            phone_number = find_contact(contact_name)
            
            if not phone_number:
                return True, f"I couldn't find {contact_name} in your contacts."
            
            speak_func(f"What should I say to {contact_name}?")
            message_content = listen_func()
            
            if not message_content or message_content == "__UNRECOGNIZED__":
                return True, "I didn't catch the message. Cancelling WhatsApp request."
            
            success, response = send_whatsapp_message(contact_name, message_content)
            return True, response

    # Pattern: "open whatsapp chat with [name]"
    if "whatsapp chat with" in lowered or "whatsapp chat for" in lowered:
        # extract name
        target = "whatsapp chat with" if "with" in lowered else "whatsapp chat for"
        contact_name = lowered.split(target)[1].strip()
        success, response = open_whatsapp_chat(contact_name)
        return True, response

    return False, None
