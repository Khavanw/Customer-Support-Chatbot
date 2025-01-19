import os
import sys
import json
import uvicorn
import logging
from typing import Iterator
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.routes.routes import init_routes
from src.query_engine.rag_engine import RAGQueryEngine
from src.language_models.prompt_template import PromptTemplateGenerator
from src.language_models.gemini_llm import GeminiLLM

load_dotenv()

class Chatbot:
    def __init__(self):
        self.prompt_generator = PromptTemplateGenerator()
        self.llm = GeminiLLM(os.getenv("GEMINI_API_KEY"))
        self.llm.set_prompt_generator(self.prompt_generator)
        self.query_engine = RAGQueryEngine(llm=self.llm)

    def stream_query(self, question: str) -> Iterator[dict]:
        """Stream response từng phần"""
        try:
            prompt_result = self.prompt_generator.prompt_generation(query=question)

            if isinstance(prompt_result, dict):
                yield {
                    "content": "```",
                    "done": False,
                    "error": None
                }

                keys = list(prompt_result.keys())
                for idx, key in enumerate(keys):
                    yield {
                        "content": json.dumps({key: list(prompt_result[key]) if isinstance (prompt_result[key], set) else prompt_result[key]}, ensure_ascii=False),
                        "done": False,
                        "error": None
                    }
                yield {
                    "content": "",
                    "done": True,
                    "error": None
                }
                return

            for chunk in self.query_engine.query(prompt_result, stream=True):
                yield {
                    "content": chunk,
                    "done": False,
                    "error": None
                }

            yield {
                "content": "",
                "done": True,
                "error": None
            }

        except Exception as e:
            logging.error(f"Error in stream_query: {str(e)}")
            yield {
                "content": "```",
                "done": False,
                "error": None
            }
            error_result = self.prompt_generator.error_response()
            keys = list(error_result.keys())
            for idx, key in enumerate(keys):
                yield {
                    "content": json.dumps({key: list(error_result[key]) if isinstance(error_result[key], set) else error_result[key]}, ensure_ascii=False),
                    "done": False,
                    "error": None
                }
            yield {
                "content": "",
                "done": True,
                "error": None
            }

def create_app():
    app = FastAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

    logging.basicConfig(
        level=logging.DEBUG if os.getenv("FASTAPI_DEBUG", "False").lower() == "true" else logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    chatbot = Chatbot()
    router = init_routes(chatbot)

    app.include_router(router)

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FASTAPI_PORT", 5000))
    
    uvicorn.run(
        app,
        host=os.getenv("FASTAPI_HOST"),
        port=port,
        reload=os.getenv("FASTAPI_DEBUG", "False").lower() == "true"
    )