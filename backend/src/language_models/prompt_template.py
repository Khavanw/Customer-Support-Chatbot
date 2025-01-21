import os
import sys
import json
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.search.hybrid_search import Hybrid_Search
from src.search.reranking import Reranking
from llama_index.core.prompts import PromptTemplate

class PromptTemplateGenerator:
    def __init__(self) -> None:
        self.search = Hybrid_Search()
        self.reranker = Reranking()
        self.prompt_tmpl = self._get_prompt_template()

    def _get_prompt_template(self) -> PromptTemplate:
        return PromptTemplate(
            template=(
                "Bạn là trợ lý AI chuyên nghiệp. Trả lời câu hỏi dựa trên ngữ cảnh và tuân thủ định dạng JSON sau:\n\n"
                "Ngữ cảnh:\n{context_str}\n\n"
                "Câu hỏi: {query_str}\n\n"
                "Yêu cầu trả về JSON nghiêm ngặt:\n"
                '{\n'
                '  "greeting": "Lời chào thân thiện, chuyên nghiệp, phù hợp với câu hỏi",\n'
                '  "description": "{description}",\n'
                '  "steps": [\n'
                '    "**Bước 1**: \\"Nười quản trị chọn **Tài chính → Thu học phí**\\",\n'
                '    "**Bước 2**: \\"Người quản trị chọn https://storage.googleapis.com/ascchatbot/icons/icon_search.png để tìm kiếm thông tin học sinh.\\",\n'
                '    "**Bước 3**: \\"Người quản trị chọn https://storage.googleapis.com/ascchatbot/icons/icon_square.png để chọn từng khoản thu hoặc chọn từng khoảng thu riêng.\\",\n'
                '    "**Bước 4**: \\"Người quản trị chọn https://storage.googleapis.com/ascchatbot/icons/icon_square.png ở các loại khoản thu và các khoản khấu trừ của học sinh\\",\n'
                '    "**Bước 5**: \\"Để chọn các khoản thu của học sinh và chọn https://storage.googleapis.com/ascchatbot/icons/icon_save.png để lưu thông tin học sinh.\\",\n'
                '  ],\n'
                '  "notes": "Các điểm quan trọng cần lưu ý, nếu KHÔNG CÓ trả về mảng rỗng",\n'
                '  "images": {"url": "IN tất cả các URL hình ảnh chính xác từ dữ liệu"},\n'
                '  "caption": "BẮT BUỘC Mô tả CAPTION chính xác từ dữ liệu, MỖI ẢNH là 1 Caption, Hình: Mô tả hệ thống báo lỗi".\n'
                '  "source": {"description": "Giới thiệu về nguồn dữ liệu dựa vào tên file PDF", "url": "URL nguồn đầy đủ"},\n'
                '  "friendly_closing": "Lời kết thân thiện"\n'
                '}\n\n'
                "Quy tắc:\n"
                "1. Trả về đúng JSON\n"
                "2. Giữ nguyên toàn bộ URL\n"
                "3. Giữ nguyên toàn bộ URL Icon trong steps\n"
                "4. Nếu có link ICON giống nhau vẫn GIỮ NGUYÊN\n"
                "5. Không thêm bất kỳ văn bản ngoài JSON\n"
                "6. Chính xác, chi tiết, đầy đủ\n"
                "7. PHẢI CÓ caption cho TẤT CẢ các ảnh\n"
                "8. Caption phải theo format: Hình: Mô tả\n"
                "9. KHÔNG để caption là mảng rỗng []\n\n"
                "Câu trả lời:"
            )
        )

    def prompt_generation(self, query: str, top_k: int = 2) -> str:
        try:
            results = self.search.query_hybrid_search(
                query=query,
                limit=3, 
                threshold=0.7
            )
            

            filtered_results = [
                result for result in results 
                if result.get('score', 0) >= 0.7
            ]
                        
            documents = []
            metadata_list = []
            for result in filtered_results:
                documents.append(result["text"])
                metadata_list.append(result["metadata"])
                logging.debug(f"Text: {result.get('text')}")
                logging.debug(f"Score: {result.get('score')}")

            reranked_indices = self.reranker.rerank_documents(
                query=query,
                documents=documents,
                top_k=top_k,
                return_indices=True
            )

            if not reranked_indices:
                return self.error_response()

            first_idx = reranked_indices[0]
            doc = documents[first_idx]
            meta = metadata_list[first_idx]

            context_part = {
                "content": doc,
                "question": meta.get("question", ""),
                "description": meta.get("description", ""),
                "source": meta.get("source", ""),
                "images": meta.get("images", {})
            }

            context = (
                f"Nội dung: {context_part['content']}\n"
                f"Câu hỏi gốc: {context_part['question']}\n"
                f"Nguồn: {context_part['source']}\n"
                f"Hình ảnh: {json.dumps(context_part['images'], ensure_ascii=False)}"
            )

            description = (f"Mô tả: {context_part['description']}")
            print(description)
            logging.debug(f"Generated description: {description}")
            print(context)
            logging.debug(f"Generated context: {context}")

            prompt = self.prompt_tmpl.format(description=description, context_str=context, query_str=query)
            
            return prompt

        except Exception as e:
            logging.error(f"Error generating prompt: {str(e)}")
            return self.error_response()
        
    def error_response(self):
        return {
            "greeting": "Chào bạn! Xin lỗi vì sự bất tiện này,",
            "description": "Tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn trong cơ sở dữ liệu. Vui lòng liên hệ với chúng tôi qua các kênh hỗ trợ sau",
            "steps": [
                "**Hỗ trợ kỹ thuật**:",
                "- Hotline hỗ trợ: **(028) 66.797.357**", 
                "- Email hỗ trợ kỹ thuật: **support@ascvn.com.vn**",
                "**Hỗ trợ kinh doanh/đối tác**:",
                "- Email: **contact@ascvn.com.vn**",
                "- Email tư vấn & demo: **sales@ascvn.com.vn**"
            ],
            "notes": {},
            "images": {},
            "source": {
                "description": "Trang Web chính thức của ASC: ",
                "url": "https://ascvn.com.vn"
            },
            "friendly_closing": "Xin vui lòng liên hệ với chúng tôi qua các thông tin trên để được hỗ trợ chi tiết. Chúng tôi luôn sẵn sàng giúp đỡ bạn!"
        }

        