import json
from pathlib import Path

MEMORY_FILE = Path(__file__).with_name("memory.json")
DEFAULT_MEMORY = {
    "travel_style": "budget",
    "favorite_interests": ["beach", "food"],
    "preferred_transport": "bus",
}


def get_memory():
    if not MEMORY_FILE.exists():
        return DEFAULT_MEMORY.copy()
    try:
        with MEMORY_FILE.open(encoding="utf-8") as memory_file:
            stored = json.load(memory_file)
        return {**DEFAULT_MEMORY, **stored} if isinstance(stored, dict) else DEFAULT_MEMORY.copy()
    except (OSError, json.JSONDecodeError):
        return DEFAULT_MEMORY.copy()


def save_memory(memory_data):
    with MEMORY_FILE.open("w", encoding="utf-8") as memory_file:
        json.dump(memory_data, memory_file, indent=2)


def update_memory(key, value):
    memory = get_memory()
    memory[key] = value
    save_memory(memory)
    return memory
