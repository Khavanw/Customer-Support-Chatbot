import os
import logging
from dotenv import load_dotenv
from underthesea import word_tokenize
from fastembed import SparseTextEmbedding
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

load_dotenv()

QDRANT_PORT = os.getenv('QDRANT_PORT', 6333)
QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
DENSE_EMBEDDING = os.getenv('DENSE_EMBEDDING')
SPARSE_EMBEDDING = os.getenv('SPARSE_EMBEDDING')
QDRANT_COLLECTION_NAME = os.getenv('QDRANT_COLLECTION_NAME', 'ASC_Chatbot')

class Hybrid_Search():
    def __init__(self,
                dense_model: str = DENSE_EMBEDDING ,
                sparse_model: str = SPARSE_EMBEDDING ) -> None:
        
        try: 
            self.embedding_model = SentenceTransformer(dense_model)
            self.sparse_embedding_model = SparseTextEmbedding(sparse_model)

            self.qdrant_client = QdrantClient(
                host=QDRANT_HOST, port=QDRANT_PORT, timeout=30)
            self.collection_name = QDRANT_COLLECTION_NAME

            logging.info("Hybrid search initialized models: {dense_model} and {sparse_model}")

        except Exception as e:
            logger.error(f"Error initializing HybridSearch: {e}")
            raise e

    def clean_text(self, text: str) -> str:
        text = text.strip()
        text = ' '.join(text.split())
        return text

    def preprocess_query(self, query: str) -> str:
        try: 
            query = self.clean_text(query)
            tokens = word_tokenize(query)
            processes_query = ' '.join(tokens)
            return processes_query

        except Exception as e:
            logger.error(f"Error preprocessing text: {e}")
            raise e
        
    def query_hybrid_search(
        self, 
        query: str,
        metadata_filter: Optional[Dict[str, Any]] = None,
        limit: int = 5,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        try:
            if not query.strip():
                return []

            processed_query = self.preprocess_query(query)
            
            dense_query = self.embedding_model.encode([processed_query])[0].tolist()
            sparse_query = list(self.sparse_embedding_model.embed([processed_query]))[0]

            results = self.qdrant_client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                prefetch=[
                    models.Prefetch(
                        query=models.SparseVector(
                            indices=sparse_query.indices.tolist(),
                            values=sparse_query.values.tolist()
                        ),
                        using="sparse",
                        limit=limit,
                    ),
                    models.Prefetch(
                        query=dense_query,
                        using="dense",
                        limit=limit,
                    ),
                ],
                query_filter=metadata_filter,
                query=models.FusionQuery(
                    fusion=models.Fusion.RRF  
                ),
            )

            search_results = []
            for point in results.points:
                if point.score >= threshold:
                    result = {
                        'text': point.payload['text'],
                        'score': float(point.score),
                        'metadata': {
                            'question': point.payload.get('question', ''),
                            'description': point.payload.get('description', ''),
                            'source': point.payload.get('source', ''),
                            'images': point.payload.get('images', {})
                        }
                    }
                    search_results.append(result)

            return sorted(search_results, key=lambda x: x['score'], reverse=True)

        except Exception as e:
            logger.error(f"Error in hybrid search: {e}")
            return []
        
    def format_search_results(self, results: List[Dict[str, Any]], include_images: bool = True) -> str:
        if not results:
            return "Không tìm thấy kết quả"
        
        formatted_text = "Kết quả tìm kiếm:\n\n"
        for i, result in enumerate(results, start=1):
            formatted_text += f"Kết quả {i} (Độ tương đồng: {result['score']:.2f}):\n"
            formatted_text += f"Câu hỏi: {result['metadata']['question']}\n"
            formatted_text += f"Nội dung: {result['text'].strip()}\n"
            formatted_text += f"Nguồn: {result['metadata']['source']}\n"
            
            if include_images and result['metadata']['images']:
                formatted_text += "Hình ảnh có liên quan:\n"
                for img_title, img_url in result['metadata']['images'].items():
                    formatted_text += f"- {img_title}: {img_url}\n"
            formatted_text += "\n"

        return formatted_text.strip()



