import asyncio
import websockets  # pyre-ignore # type: ignore
import json
import time

async def listen_to_bridge():
    uri = "ws://127.0.0.1:8765"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket Bridge.")
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            print(f"[{time.strftime('%X')}] Received:", data)

if __name__ == "__main__":
    asyncio.run(listen_to_bridge())
