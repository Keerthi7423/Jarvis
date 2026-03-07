"""System event monitoring module for proactive alerts."""

from __future__ import annotations

import threading
import time
from typing import Callable

import psutil  # pyre-ignore

from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.event_monitor")

_COOLDOWN_SECONDS = 120.0
_CHECK_INTERVAL = 5.0

class EventMonitor:
    def __init__(self, alert_callback: Callable[[str], None]) -> None:
        self._alert_callback = alert_callback
        self._last_alert_time = 0.0
        self._stop_event = threading.Event()

    def start(self) -> threading.Thread:
        """Start the background event monitor thread."""
        thread = threading.Thread(target=self._monitor_loop, daemon=True, name="EventMonitorThread")
        thread.start()
        return thread
        
    def stop(self) -> None:
        """Stop the background monitor."""
        self._stop_event.set()

    def check_network_disconnected(self) -> bool:
        """Check if network is disconnected by inspecting interfaces."""
        try:
            stats = psutil.net_if_stats()
            # If any non-loopback interface is up, we consider network connected
            for name, stat in stats.items():
                if "loopback" not in name.lower() and stat.isup:
                    return False
            return True
        except Exception as exc:
            logger.error("Failed to check network status: %s", exc)
            return False

    def _monitor_loop(self) -> None:
        logger.info("Event monitor started. Background system checks active.")
        
        # Initial call to cpu_percent to set the baseline
        psutil.cpu_percent(interval=None)
        
        while not self._stop_event.is_set():
            time.sleep(_CHECK_INTERVAL)
            try:
                cpu = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory().percent
                network_disconnected = self.check_network_disconnected()
                
                alert_msg = None
                if network_disconnected:
                    alert_msg = "Warning. Network disconnected."
                elif cpu > 80.0:
                    alert_msg = "Warning. CPU usage is high."
                elif ram > 85.0:
                    alert_msg = "Warning. Memory usage is high."

                if alert_msg:
                    now = time.monotonic()
                    if now - self._last_alert_time >= _COOLDOWN_SECONDS:
                        logger.warning("Event monitor triggering alert: %s", alert_msg)
                        self._alert_callback(alert_msg)
                        self._last_alert_time = now
                    else:
                        logger.debug("Event monitor suppressing alert due to cooldown: %s", alert_msg)

            except Exception as exc:
                logger.error("Error in event monitor loop: %s", exc)

def start_event_monitor(alert_callback: Callable[[str], None]) -> threading.Thread:
    """Start a global background event monitor."""
    monitor = EventMonitor(alert_callback)
    return monitor.start()
