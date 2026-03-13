from commands.movie_commands import execute_movie_command  # pyre-ignore

def test_movie_search():
    print("Testing BookMyShow movie search...")
    
    # Test 1: Open BookMyShow
    print("\nTest 1: Opening BookMyShow")
    handled, response = execute_movie_command("open bookmyshow")
    print(f"Handled: {handled}, Response: {response}")
    
    # Test 2: Search for a movie
    print("\nTest 2: Searching for Oppenheimer")
    handled, response = execute_movie_command("search for movie Oppenheimer")
    print(f"Handled: {handled}, Response: {response}")

if __name__ == "__main__":
    test_movie_search()
