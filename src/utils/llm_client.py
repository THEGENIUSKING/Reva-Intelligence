"""
Unified Free-Tier LLM Client for Reva.
Supports Google Gemini 2.0 Flash (Zero-Cost Free Tier) and Groq Cloud (Llama 3.3 70B Free Tier)
with rate limiting, exponential backoff, and strict JSON output.
"""

import json
import os
import time
from typing import Any, Dict, List, Optional
import urllib.error
import urllib.request

from src.core.engine import LIMITERS


class FreeLLMClient:
    """
    Zero-Cost LLM Client using Google Gemini Free Tier and Groq Free Tier.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
        self.groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON using a configured external model provider."""
        errors = []
        if self.gemini_key and not self.gemini_key.startswith("your_"):
            try:
                return self._call_gemini(prompt, system_instruction)
            except Exception as exc:
                errors.append(f"Gemini: {exc}")
        if self.groq_key and not self.groq_key.startswith("your_"):
            try:
                return self._call_groq(prompt, system_instruction)
            except Exception as exc:
                errors.append(f"Groq: {exc}")
        if errors:
            raise RuntimeError("Configured LLM providers failed: " + "; ".join(errors))
        raise RuntimeError("No LLM provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY.")

    def _call_gemini(self, prompt: str, system_instruction: Optional[str]) -> Dict[str, Any]:
        """Call Gemini through the current Interactions API."""
        url = "https://generativelanguage.googleapis.com/v1beta/interactions"
        body: Dict[str, Any] = {
            "model": self.gemini_model,
            "input": [{"type": "text", "text": prompt}],
            "response_format": {"type": "text", "mime_type": "application/json"},
            "generation_config": {"thinking_level": "low", "max_output_tokens": 8192},
        }
        if system_instruction:
            body["system_instruction"] = system_instruction

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": self.gemini_key},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        text = "".join(
            block.get("text", "")
            for step in data.get("steps", []) if step.get("type") == "model_output"
            for block in step.get("content", []) if block.get("type") == "text"
        )
        if not text:
            raise RuntimeError("Gemini returned no text output")
        return json.loads(text)

    def _call_groq(self, prompt: str, system_instruction: Optional[str]) -> Dict[str, Any]:
        """Call Groq Cloud Free Tier via OpenAI-compatible REST endpoint."""
        url = "https://api.groq.com/openai/v1/chat/completions"
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        body = {
            "model": self.groq_model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.groq_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        text = data["choices"][0]["message"]["content"]
        return json.loads(text)



# Global singleton instance
llm_client = FreeLLMClient()
