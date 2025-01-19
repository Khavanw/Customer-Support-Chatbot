import os
import logging
from typing import Union, List
from dotenv import load_dotenv
from sentence_transformers import CrossEncoder

load_dotenv()

RERANKING_MODEL= os.getenv('RERANKING_MODEL')
MODELS_HOME = os.getenv('MODELS_HOME')


class Reranking:
    def __init__(self, model_name: str = RERANKING_MODEL) -> None:
        try:
            rerank_model = os.path.join(MODELS_HOME, "rerank")
            self.model = CrossEncoder(model_name, cache_dir=rerank_model)
            logging.info(f"Reranking model {model_name} loaded successfully.")
        except Exception as e:
            logging.error(f"Error loading reranking model: {e}")
            raise
        
    def rerank_documents(self, query: str, documents: List[str], top_k: int = 2, return_indices: bool = False) -> Union[List[str], List[int]]:
        try:
            scores = self.model.predict([(query, doc) for doc in documents])
            ranked_pairs = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
            top_indices = [idx for idx, _ in ranked_pairs[:top_k]]
            
            if return_indices:
                return top_indices
            
            return [documents[idx] for idx in top_indices]
                
        except Exception as e:
            logging.error(f"Error in reranking: {e}")
            if return_indices:
                return list(range(min(top_k, len(documents))))
            return documents[:top_k]

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    try:
        rerank = Reranking()
    except Exception as e:
        logging.error(f"Application failed: {e}")

