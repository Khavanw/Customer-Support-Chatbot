import os
import logging
from dotenv import load_dotenv
from typing import List, Dict, Generator, Optional
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class GeminiLLM:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.generation_config = {
            "temperature": 0.5,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 5000,
        }
        self.model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        self.prompt_generator = None
        self.metadata = {
            "model_name": "gemini-1.5-flash",
            "context_window": 5000,
            "max_tokens": 5000,
        }

    def complete(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logging.error(f"Gemini completion error: {e}")
            raise

    def stream_complete(self, prompt: str) -> Generator[str, None, None]:
        try:
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logging.error(f"Error in stream_complete: {e}")
            raise

    def chat(self, messages: List[Dict[str, str]]) -> str:
        try:
            combined_prompt = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
            return self.complete(combined_prompt)
        except Exception as e:
            logging.error(f"Chat completion error: {e}")
            raise

    def stream_query(self, question: str) -> Generator[Dict[str, Optional[str]], None, None]:
        if not self.prompt_generator:
            logging.error("Prompt generator not initialized.")
            yield self._error_response("Lỗi hệ thống: Prompt generator chưa được khởi tạo")
            return

        try:
            prompt = self.prompt_generator.prompt_generation(question)
            if not prompt:
                yield self._error_response("Không thể tạo câu trả lời, vui lòng thử lại.")
                return

            response = self.model.generate_content(prompt, stream=True, generation_config=self.generation_config)
            chunks = list(response)
            
            for i, chunk in enumerate(chunks):
                if chunk.text:
                    yield {
                        "content": chunk.text,
                        "done": i == len(chunks) - 1,  # True chỉ khi là chunk cuối cùng
                        "error": None
                    }

        except Exception as e:
            logging.error(f"Error in stream_query: {e}")
            yield self._error_response(f"Lỗi xử lý: {str(e)}")

    def set_prompt_generator(self, prompt_generator):
        self.prompt_generator = prompt_generator

    @staticmethod
    def _error_response(message: str) -> Dict[str, Optional[str]]:
        """Tạo response lỗi."""
        return {"content": message, "done": True, "error": message}
