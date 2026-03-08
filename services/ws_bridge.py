"""WebSocket bridge to stream assistant events to the Electron dashboard."""

from __future__ import annotations

import asyncio
import json
import threading
from typing import Any

from config.settings import WS_BRIDGE_ENABLED, WS_BRIDGE_HOST, WS_BRIDGE_PORT  # pyre-ignore
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.ws_bridge")

try:
    from websockets.server import WebSocketServerProtocol, serve  # pyre-ignore
except Exception:  # pragma: no cover - guarded by startup checks
    WebSocketServerProtocol = Any  # type: ignore[assignment,misc]
    serve = None

try:
    import psutil  # pyre-ignore
except Exception:  # pragma: no cover - guarded by runtime checks
    psutil = None


class WebSocketBridge:
    """Async websocket broadcaster running on a background thread."""

    def __init__(self, host: str = WS_BRIDGE_HOST, port: int = WS_BRIDGE_PORT, on_connect_cb=None) -> None:
        self._enabled = WS_BRIDGE_ENABLED
        self._host = host
        self._port = port
        self._on_connect_cb = on_connect_cb
        self._clients: set[WebSocketServerProtocol] = set()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._server = None
        self._latest_state: dict[str, dict[str, Any]] = {}

    def start(self) -> None:
        """Start websocket server loop on a daemon thread."""
        if not self._enabled:
            logger.info("WebSocket bridge disabled by configuration.")
            return
        if serve is None:
            logger.warning("WebSocket bridge unavailable. Install 'websockets' package.")
            return
        if self._thread is not None:
            return

        self._thread = threading.Thread(target=self._run_server, daemon=True, name="jarvis-ws-bridge")
        self._thread.start()  # pyre-ignore
        logger.info("WebSocket bridge start requested on ws://%s:%s", self._host, self._port)

    def publish(self, event_type: str, text: str) -> None:
        """Broadcast event to all connected websocket clients."""
        message = str(text).strip()
        if not self._enabled or not message:
            return
        if self._loop is None or not self._loop.is_running():  # pyre-ignore
            return

        payload = {"type": event_type, "text": message}
        logger.info("Broadcasting to UI: %s", payload)
        try:
            asyncio.run_coroutine_threadsafe(self._broadcast(payload), self._loop)  # pyre-ignore
        except Exception as exc:
            logger.debug("Could not queue websocket payload: %s", exc)

    def publish_state(self, state_type: str, **payload: Any) -> None:
        """Broadcast persistent state snapshots such as current mode."""
        if not self._enabled:
            return

        message = {"type": state_type, **payload}
        self._latest_state[state_type] = message
        if self._loop is None or not self._loop.is_running():  # pyre-ignore
            return

        try:
            asyncio.run_coroutine_threadsafe(self._broadcast(message), self._loop)  # pyre-ignore
        except Exception as exc:
            logger.debug("Could not queue websocket state payload: %s", exc)

    def _run_server(self) -> None:
        loop = asyncio.new_event_loop()
        self._loop = loop
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._serve_forever())
        loop.run_forever()

    async def _serve_forever(self) -> None:
        try:
            self._server = await serve(self._handle_client, self._host, self._port)  # pyre-ignore
            logger.info("WebSocket bridge listening at ws://%s:%s", self._host, self._port)
            if psutil is None:
                logger.warning("System stats disabled. Install 'psutil' package.")
            else:
                asyncio.create_task(self._stats_loop())
        except Exception as exc:
            logger.error("Failed to start websocket bridge: %s", exc, exc_info=True)

    async def _handle_client(self, websocket: WebSocketServerProtocol) -> None:
        self._clients.add(websocket)
        logger.info("Dashboard client connected (%d active).", len(self._clients))
        if self._on_connect_cb:
            try:
                # Run the callback in a separate thread to avoid blocking the async event loop.
                threading.Thread(target=self._on_connect_cb, daemon=True).start()
            except Exception as exc:
                logger.error("Error starting bridge connection callback thread: %s", exc)

        try:
            await self._send_initial_state(websocket)
            async for _ in websocket:
                # Server is broadcast-only for now; ignore inbound messages.
                continue
        except Exception:
            pass
        finally:
            self._clients.discard(websocket)
            logger.info("Dashboard client disconnected (%d active).", len(self._clients))

    async def _send_initial_state(self, websocket: WebSocketServerProtocol) -> None:
        """Push the latest stateful payloads to a newly connected client."""
        for payload in self._latest_state.values():
            try:
                await websocket.send(json.dumps(payload))  # pyre-ignore
            except Exception:
                break

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        if not self._clients:
            return

        data = json.dumps(payload)
        stale_clients: list[WebSocketServerProtocol] = []
        for client in self._clients:
            try:
                await client.send(data)
            except Exception:
                stale_clients.append(client)

        for stale in stale_clients:
            self._clients.discard(stale)

    async def _stats_loop(self) -> None:
        """Publish CPU/RAM/network stats once per second."""
        previous = psutil.net_io_counters() if psutil is not None else None
        while True:
            try:
                if psutil is None:
                    await asyncio.sleep(1.0)
                    continue

                net_now = psutil.net_io_counters()  # pyre-ignore
                cpu = int(round(psutil.cpu_percent(interval=None)))  # pyre-ignore
                ram = int(round(psutil.virtual_memory().percent))  # pyre-ignore
                sent_delta = max(0, int(net_now.bytes_sent - previous.bytes_sent)) if previous else 0  # pyre-ignore
                recv_delta = max(0, int(net_now.bytes_recv - previous.bytes_recv)) if previous else 0
                previous = net_now

                payload = {
                    "type": "system_stats",
                    "cpu": cpu,
                    "ram": ram,
                    "network": int((sent_delta + recv_delta) / 1024),
                    "network_sent": sent_delta,
                    "network_received": recv_delta,
                }
                await self._broadcast(payload)
            except Exception as exc:
                logger.debug("System stats publish error: %s", exc)
            await asyncio.sleep(1.0)
