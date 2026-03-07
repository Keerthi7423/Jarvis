"""Workflow execution module for Jarvis."""

from __future__ import annotations

import time
from typing import TypedDict

from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.workflows")

class WorkflowDef(TypedDict):
    """Definition of a multi-step workflow."""
    steps: list[str]
    success_message: str

WORKFLOWS: dict[str, WorkflowDef] = {
    "prepare coding environment": {
        "steps": [
            "open vs code",
            "open terminal",
            "open project folder"
        ],
        "success_message": "Coding environment ready."
    },
    "start study session": {
        "steps": [
            "open chrome",
            "open study materials"
        ],
        "success_message": "Study session started."
    }
}

def resolve_workflow(command_text: str) -> str | None:
    """Return the workflow name if the given normalized command text matches a defined workflow."""
    if not command_text:
        return None
    if command_text in WORKFLOWS:
        return command_text
    return None

def execute_workflow(workflow_name: str, command_executor) -> bool:
    """
    Execute all steps in a workflow sequentially.
    
    Args:
        workflow_name: The normalized name of the workflow.
        command_executor: The callable to execute individual steps.
        
    Returns:
        True if workflow is found and executed, False otherwise.
    """
    workflow = WORKFLOWS.get(workflow_name)
    if not workflow:
        return False
        
    logger.info("Starting workflow: '%s'", workflow_name)
    try:
        for step in workflow["steps"]:
            logger.info("Executing workflow step: %s", step)
            success = command_executor(step)
            if not success:
                logger.warning("Workflow step failed: %s", step)
                raise RuntimeError(f"Step failed: {step}")
            time.sleep(1.0)  # Brief pause between application launches
            
        logger.info("Workflow completed: '%s'", workflow_name)
        return True
    except Exception as exc:
        from core.error_handler import handle_error  # pyre-ignore
        msg = handle_error(exc, f"Workflow execution failed: {workflow_name}")
        raise RuntimeError(msg)

def get_workflow_success_message(workflow_name: str) -> str:
    """Return the success message for a given workflow."""
    workflow = WORKFLOWS.get(workflow_name)
    if workflow:
        return workflow["success_message"]
    return "Workflow completed."
