"""Movie search automation for Jarvis using Selenium and BookMyShow."""

import time
from typing import Optional, Tuple
from selenium import webdriver  # pyre-ignore
from selenium.webdriver.common.by import By  # pyre-ignore
from selenium.webdriver.common.keys import Keys  # pyre-ignore
from selenium.webdriver.chrome.service import Service  # pyre-ignore
from selenium.webdriver.chrome.options import Options  # pyre-ignore
from selenium.webdriver.support.ui import WebDriverWait  # pyre-ignore
from selenium.webdriver.support import expected_conditions as EC  # pyre-ignore
from webdriver_manager.chrome import ChromeDriverManager  # pyre-ignore
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.movie_commands")

# global driver instance to keep browser open
_driver: Optional[webdriver.Chrome] = None

def _get_driver() -> webdriver.Chrome:
    """Initialize and return the Chrome WebDriver."""
    global _driver
    if _driver is None:
        chrome_options = Options()
        # Keep browser open after script finishes
        chrome_options.add_experimental_option("detach", True)
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-notifications")
        
        service = Service(ChromeDriverManager().install())
        _driver = webdriver.Chrome(service=service, options=chrome_options)
    return _driver

def open_bookmyshow() -> bool:
    """Open BookMyShow website."""
    try:
        driver = _get_driver()
        driver.get("https://in.bookmyshow.com")
        logger.info("Opened BookMyShow")
        return True
    except Exception as e:
        logger.error(f"Failed to open BookMyShow: {e}")
        return False

def search_movie(movie_name: str) -> bool:
    """Search for a specific movie on BookMyShow."""
    try:
        driver = _get_driver()
        
        # Ensure we are on the site
        if "bookmyshow.com" not in driver.current_url:
            open_bookmyshow()
            time.sleep(2)

        # 1. Handle city selection if it appears
        try:
            # Multiple possible selectors for city modal
            city_selectors = [
                "//span[contains(text(), 'Mumbai')]",
                "//p[contains(text(), 'Mumbai')]",
                "div.sc-7silkt-0 p",
                "img[alt='MUMBAI']"
            ]
            for selector in city_selectors:
                try:
                    by = By.XPATH if selector.startswith("//") else By.CSS_SELECTOR
                    city_element = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    city_element.click()
                    logger.info(f"Selected city using selector: {selector}")
                    time.sleep(1)
                    break
                except Exception:
                    continue
        except Exception:
            logger.info("City selection modal did not appear or was already handled.")

        # 2. Click the search bar trigger
        try:
            # Different possible triggers
            trigger_selectors = [
                "div.sc-7silkt-1", 
                "span.sc-7silkt-1",
                "//div[contains(text(), 'Search for Movies')]",
                "[placeholder*='Search for Movies']"
            ]
            trigger_found = False
            for selector in trigger_selectors:
                try:
                    by = By.XPATH if selector.startswith("//") else By.CSS_SELECTOR
                    search_trigger = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    search_trigger.click()
                    trigger_found = True
                    logger.info(f"Clicked search trigger using: {selector}")
                    time.sleep(1)
                    break
                except Exception:
                    continue
            
            if not trigger_found:
                logger.error("Could not find search trigger")
                return False
        except Exception as e:
            logger.error(f"Search trigger step failed: {e}")
            return False

        # 3. Enter movie name in the actual input field
        try:
            input_selectors = [
                "input[placeholder*='Search for Movies']",
                "input.sc-vuznvr-5",
                "//input[@type='text' and contains(@placeholder, 'Search')]"
            ]
            input_found = False
            for selector in input_selectors:
                try:
                    by = By.XPATH if selector.startswith("//") else By.CSS_SELECTOR
                    search_input = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((by, selector))
                    )
                    search_input.clear()
                    search_input.send_keys(movie_name)
                    time.sleep(0.5)
                    search_input.send_keys(Keys.ENTER)
                    input_found = True
                    logger.info(f"Entered movie name using: {selector}")
                    break
                except Exception:
                    continue
            
            if not input_found:
                logger.error("Could not find search input")
                return False
                
            return True
        except Exception as e:
            logger.error(f"Search input step failed: {e}")
            return False

    except Exception as e:
        logger.error(f"Movie search failed: {e}")
        return False

def execute_movie_command(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check if the text contains a movie command and execute it.
    
    Returns:
        A tuple of (handled, response_message).
    """
    lowered_text = text.lower().strip()
    
    # 1. Opening BookMyShow
    if any(phrase in lowered_text for phrase in ["open bookmyshow", "launch bookmyshow", "go to bookmyshow"]):
        if open_bookmyshow():
            return True, "Opening BookMyShow for you."
        else:
            return True, "I couldn't open BookMyShow at the moment."
            
    # 2. Searching for a movie
    # Phrases like "search for movie Oppenheimer" or "search Oppenheimer on BookMyShow"
    search_phrases = ["search for movie ", "search movie ", "find movie "]
    for phrase in search_phrases:
        if phrase in lowered_text:
            movie_name = lowered_text.split(phrase)[-1].strip()
            if movie_name:
                # Remove "on bookmyshow" if present
                if " on bookmyshow" in movie_name:
                    movie_name = movie_name.replace(" on bookmyshow", "").strip()
                
                # Feedback before starting automation
                # (The assistant caller will speak this)
                success = search_movie(movie_name)
                if success:
                    return True, f"Searching for the movie {movie_name} on BookMyShow."
                else:
                    return True, f"I found the movie {movie_name}, but I had trouble searching for it on the website."

    # If "search" and "bookmyshow" are both present but not in the above formats
    if "search" in lowered_text and "bookmyshow" in lowered_text:
         # Try to extract movie name more aggressively
         words = lowered_text.split()
         try:
             search_idx = words.index("search")
             # Get the words after the search keyword
             raw_movie_words = words[search_idx + 1:]  # pyre-ignore
             movie_words = [str(w) for w in raw_movie_words]
             # Filter out noise words
             filtered_words = [w for w in movie_words if w not in ["for", "movie", "on", "bookmyshow"]]
             movie_name = " ".join(filtered_words)
             if movie_name:
                 if search_movie(movie_name):
                     return True, f"Searching for {movie_name} on BookMyShow."
                 else:
                     return True, f"I tried searching for {movie_name} on BookMyShow, but something went wrong."
         except (ValueError, IndexError):
             pass

    return False, None
