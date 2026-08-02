"""
LLM Client — Local inference via LangChain's ChatOllama integration.
100% local, no data leaves your machine, $0 cost.
"""
import logging
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

import config

logger = logging.getLogger(__name__)

class LLMClient:
    """LangChain ChatOllama client for local inference."""

    def __init__(
        self,
        model: str = None,
        base_url: str = None,
    ):
        self.model = model or config.OLLAMA_MODEL
        self.base_url = base_url or config.OLLAMA_BASE_URL
        
        # Initialize LangChain ChatOllama
        self.llm = ChatOllama(
            model=self.model,
            base_url=self.base_url,
            temperature=config.OLLAMA_TEMPERATURE,
            num_predict=config.OLLAMA_MAX_TOKENS,
            top_p=config.OLLAMA_TOP_P,
            top_k=config.OLLAMA_TOP_K,
            repeat_penalty=config.OLLAMA_REPEAT_PENALTY
        )
        logger.info(f"LangChain ChatOllama ready — model: {self.model}")

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = None,
        max_tokens: int = None,
    ) -> str:
        """Generate a response using LangChain ChatOllama."""
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"LangChain generation failed: {e}")
            return f"Error: Could not generate response. Is Ollama running? ({e})"

    def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = None,
    ):
        """Streaming generation — yields tokens one at a time using LangChain."""
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            for chunk in self.llm.stream(messages):
                yield chunk.content
        except Exception as e:
            logger.error(f"LangChain streaming failed: {e}")
            yield f"\n\nError: Streaming failed. ({e})"
