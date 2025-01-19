import json
import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

class QuestionRequest(BaseModel):
    question: str

def init_routes(chatbot):
    router = APIRouter()

    @router.post("/api/query")
    async def query_api(request: QuestionRequest):
        try:
            logging.info(f"Received question: {request.question}")

            async def generate():
                yield '{"stream": ['
                
                first_chunk = True

                for chunk in chatbot.stream_query(request.question):
                    if chunk.get("content"):
                        if not first_chunk:
                            yield ','
                        
                        # Nếu là JSON hoàn chỉnh, parse và format lại
                        try:
                            if chunk["content"].startswith('{'):
                                json_content = json.loads(chunk["content"])
                                chunk["content"] = json.dumps(json_content, ensure_ascii=False)
                        except json.JSONDecodeError:
                            pass
                            
                        chunk_json = json.dumps(chunk, ensure_ascii=False)
                        yield chunk_json
                        first_chunk = False
                
                if first_chunk:
                    yield json.dumps({
                        "content": "Không nhận được phản hồi",
                        "done": True,
                        "error": None
                    }, ensure_ascii=False)
                
                yield ']}'

            return StreamingResponse(
                generate(),
                media_type='application/json',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'
                }
            )

        except Exception as e:
            logging.error(f"API error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
    @router.post('/api/test-prompt')
    async def test_prompt(request: QuestionRequest):
        try:
            prompt = chatbot.prompt_generator.prompt_generation(request.question)
            return ({
                "question": request.question,
                "prompt": prompt
            })
        except Exception as e:
            logging.error(f"Test prompt error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
    return router