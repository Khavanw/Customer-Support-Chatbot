import logging
from src.indexing.qdrant_indexer import QdrantIndexing

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def initialize_qdrant():
    try:
        indexing = QdrantIndexing()
        
        # Kiểm tra và tạo collection
        logging.info("Checking and creating collection...")
        indexing.client_collection()    
        
        # Load và import data
        logging.info("Loading and importing data...")
        indexing.load_nodes(indexing.data_path)
        indexing.documents_insertion()
        
        logging.info("Initialization completed successfully!")
        
    except Exception as e:
        logging.error(f"Initialization failed: {e}")
        raise

if __name__ == "__main__":
    initialize_qdrant() 