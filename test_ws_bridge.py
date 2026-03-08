import asyncio
import websockets  # pyre-ignore # type: ignore
import json

async def test_bridge():
    uri = "ws://127.0.0.1:8765"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to bridge.")
            # Send a fake command to see if it echoes or handles it (it doesn't, but let's see if we get stats)
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"Received: {data}")
                if data.get('type') == 'response':
                    print("SUCCESS: Received response from bridge!")
                    return
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_bridge())
