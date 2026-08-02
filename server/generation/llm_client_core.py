"""
Core Python LLM Client — Direct Ollama REST API (No LangChain).
Approach 2: Pure Python implementation using requests library.
100% local, no data leaves your machine, $0 cost.
"""
import logging
import requests
import json

import config

logger = logging.getLogger(__name__)


class CoreLLMClient:
    """Pure Python Ollama client — direct REST API calls, no LangChain."""

    def __init__(
        self,
        model: str = None,
        base_url: str = None,
    ):
        self.model = model or config.OLLAMA_MODEL
        self.base_url = (base_url or config.OLLAMA_BASE_URL).rstrip("/")
        self.chat_url = f"{self.base_url}/api/chat"
        logger.info(f"Core Python Ollama client ready — model: {self.model}")

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = None,
        max_tokens: int = None,
    ) -> str:
        """Generate a response using direct Ollama REST API."""
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {
                    "temperature": temperature or config.OLLAMA_TEMPERATURE,
                    "num_predict": max_tokens or config.OLLAMA_MAX_TOKENS,
                    "top_p": config.OLLAMA_TOP_P,
                    "top_k": config.OLLAMA_TOP_K,
                    "repeat_penalty": config.OLLAMA_REPEAT_PENALTY,
                },
            }

            response = requests.post(
                self.chat_url,
                json=payload,
                timeout=config.OLLAMA_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

        except Exception as e:
            logger.error(f"Core Python generation failed: {e}")
            return f"Error: Could not generate response. Is Ollama running? ({e})"

    def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = None,
    ):
        """Streaming generation — yields tokens one at a time via raw HTTP."""
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": True,
                "options": {
                    "temperature": temperature or config.OLLAMA_TEMPERATURE,
                    "num_predict": config.OLLAMA_MAX_TOKENS,
                    "top_p": config.OLLAMA_TOP_P,
                    "top_k": config.OLLAMA_TOP_K,
                    "repeat_penalty": config.OLLAMA_REPEAT_PENALTY,
                },
            }

            with requests.post(
                self.chat_url,
                json=payload,
                stream=True,
                timeout=config.OLLAMA_TIMEOUT,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content

        except Exception as e:
            logger.error(f"Core Python streaming failed: {e}")
            yield f"\n\nError: Streaming failed. ({e})"
