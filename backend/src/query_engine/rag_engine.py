import os
import sys
import logging
from dotenv import load_dotenv
from typing import Optional, Generator, Union
from llama_index.core.response_synthesizers import BaseSynthesizer
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.language_models.gemini_llm import GeminiLLM

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class RAGQueryEngine:
    def __init__(
        self,
        llm: GeminiLLM,
        respose_synthesizer: Optional[BaseSynthesizer] = None,
        max_retries: int = 3
    ):
        self.llm = llm
        self.response_synthesizer = respose_synthesizer
        self.max_retries = max_retries
        logging.info(f"RAGQueryEngine initialized with LLM: {llm.model}")
    
    def query(self, prompt: str, stream: bool = False) -> Union[str, Generator[str, None, None]]:
        try:
            for attempt in range(self.max_retries):
                try:
                    if stream:
                        # Stream response từng token
                        for chunk in self.llm.stream_complete(prompt):
                            if self.response_synthesizer:
                                chunk = self.response_synthesizer.get_response(
                                    query_str=str(chunk),
                                    text_chunks=[str(prompt)]
                                )
                            yield chunk
                    else:
                        # không streaming
                        response = self.llm.complete(prompt)
                        if self.response_synthesizer:
                            response = self.response_synthesizer.get_response(
                                query_str=str(response),
                                text_chunks=[str(prompt)]
                            )
                        return response
                    break
                except Exception as e:
                    if attempt == self.max_retries - 1:
                        raise
                    logging.warning(f"Attempt {attempt + 1} failed with error: {e}")
                    continue
        except Exception as e:
            error_msg = f"Error querying RAG engine: {e}"
            logging.error(error_msg)
            if stream:
                yield error_msg
            else:
                return error_msg

def create_query_engine(prompt: str, stream: bool = False) -> Union[str, Generator[str, None, None]]:
    try:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in the environment variables.")
        
        llm = GeminiLLM(GEMINI_API_KEY)

        query_engine = RAGQueryEngine(
            llm=llm,
            respose_synthesizer=None,
            max_retries=3
        )

        if stream:
            return query_engine.query(prompt, stream=True)
        else:
            return query_engine.query(prompt)

    except Exception as e:
        error_msg = f"Error creating RAG query engine: {e}"
        logging.error(error_msg)
        if stream:
            yield error_msg
        else:
            return error_msg