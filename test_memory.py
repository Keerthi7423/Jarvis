from core.memory_manager import save_memory, get_memory, delete_memory  # pyre-ignore
import os
import json

def test_memory_system():
    print("Testing Jarvis Memory System...")
    
    # Test 1: Save memory
    print("\nTest 1: Saving 'name' as 'Keerthi'")
    save_memory("name", "Keerthi")
    
    # Verify file content
    with open("data/memory.json", "r") as f:
        data = json.load(f)
        print(f"File content: {data}")
    
    # Test 2: Get memory
    print("\nTest 2: Retrieving 'name'")
    name = get_memory("name")
    print(f"Retrieved: {name}")
    
    # Test 3: Delete memory
    print("\nTest 3: Deleting 'name'")
    delete_memory("name")
    name = get_memory("name")
    print(f"Retrieved after deletion: {name}")

if __name__ == "__main__":
    test_memory_system()
