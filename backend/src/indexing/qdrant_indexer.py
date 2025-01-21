import logging 
from dotenv import load_dotenv
import os
import json
from sentence_transformers import SentenceTransformer
from fastembed import SparseTextEmbedding
from qdrant_client import QdrantClient, models
from tqdm import tqdm

load_dotenv()

QDRANT_HOST = os.getenv('QDRANT_HOST')
QDRANT_PORT = os.getenv('QDRANT_PORT')
QDRANT_COLLECTION_NAME = os.getenv('QDRANT_COLLECTION_NAME')
DENSE_EMBEDDING = os.getenv('DENSE_EMBEDDING')
SPARSE_EMBEDDING = os.getenv('SPARSE_EMBEDDING')    
MODELS_HOME = os.getenv('MODELS_HOME')


os.environ["SENTENCE_TRANSFORMERS_HOME"] = MODELS_HOME

class QdrantIndexing:
    def __init__(self) -> None:
        self.data_path = r"backend/data/data_original/node.json"

        dense_model = os.path.join(MODELS_HOME, "dense")
        logging.info(f"Loading dense embedding model from {DENSE_EMBEDDING}")
        self.embedding_model = SentenceTransformer(DENSE_EMBEDDING, cache_folder=dense_model)

        sparse_model = os.path.join(MODELS_HOME, "sparse")
        logging.info(f"Loading sparse embedding model from {SPARSE_EMBEDDING}")
        self.sparse_embedding_model = SparseTextEmbedding(SPARSE_EMBEDDING, cache_dir=sparse_model)

        self.qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        self.metadata = []
        self.documents = []
        logging.info("QdrantIndexer object initialized.")
        logging.info(f"Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")

    def load_nodes(self, input_file):
        try: 
            with open(self.data_path, 'r', encoding='utf-8') as file:
                data = json.load(file)

            self.metadata = []
            self.documents = []

            for qa_pair in data["data"]:
                document_text = f"""
                Câu hỏi: {qa_pair["question"]}
                Mô tả: {qa_pair["answer"]["description"]}
                Các bước thực hiện: 
                {' '.join(qa_pair["answer"]["steps"])}
                Ghi chú: {qa_pair["answer"]["notes"]}    
                """
                
                metadata = {
                    "source": qa_pair['answer']["source"],
                    "question": qa_pair["question"],
                    "images": qa_pair["answer"]["images"],
                }

                self.metadata.append(metadata)
                self.documents.append(document_text)
            logging.info(f"Loaded {len(self.documents)} documents from json file")

        except Exception as e:
            logging.error(f"Error loading nodes: {e}")

    def client_collection(self):
        try:
            if not self.qdrant_client.collection_exists(collection_name=f"{QDRANT_COLLECTION_NAME}"):
                self.qdrant_client.create_collection(
                    collection_name=QDRANT_COLLECTION_NAME,
                    vectors_config={
                        "dense": models.VectorParams(
                            size=768, 
                            distance=models.Distance.COSINE
                        )
                    },
                    sparse_vectors_config={
                        "sparse": models.SparseVectorParams(
                            index=models.SparseIndexParams(
                                on_disk=False,
                            )
                        )
                    }
                )

                logging.info(f" Created Collection '{QDRANT_COLLECTION_NAME}' created successfully.")
            else:
                logging.info(f" Collection '{QDRANT_COLLECTION_NAME}' already exists.")
        except Exception as e:
            logging.error(f"Error creating collection: {e}")
            raise
    
    def create_sparse_vectors(self, text):
        try:
            embeddings = list(self.sparse_embedding_model.embed([text]))[0]
            if hasattr(embeddings, 'indices') and hasattr(embeddings, 'values'):
                sparse_vector = models.SparseVector(
                    indices=embeddings.indices,
                    values=embeddings.values
                )
                return sparse_vector
            else:
                raise ValueError("The embeddings object does not have 'indices' or 'values' attributes.")
        except Exception as e:
            logging.error(f"Error creating sparse vectors: {e}")
            raise
    
    def documents_insertion(self):
        try:
            points = []
            for i, (doc, metadata) in enumerate(tqdm(zip(self.documents, self.metadata), 
                                                     total = len(self.documents),
                                                     desc = "Processing documents")):
                dense_embedding = list(self.embedding_model.encode([doc]))[0]
                sparse_vector = self.create_sparse_vectors(doc)

                point = models.PointStruct(
                    id=i,
                    vector={
                        "dense": dense_embedding.tolist(),
                        "sparse": sparse_vector
                    },
                    payload={
                        'text': doc,
                        **metadata
                    }
                )
                points.append(point)

            # Bach upsert với kích thước nhỏ hơn để tránh quá tải
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self.qdrant_client.upsert(
                    collection_name=QDRANT_COLLECTION_NAME, 
                    points=batch
                )

                logging.info(f"Upserted batch {i//batch_size + 1} of {len(points)-1//batch_size+1}.")

            logging.info(f"Inserted {len(points)} documents into Qdrant.")
        except Exception as e:
            logging.error(f"Error inserting documents: {e}")
            raise

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    try:
        indexing = QdrantIndexing()
        indexing.load_nodes(indexing.data_path)
        indexing.client_collection()
        indexing.documents_insertion()
    except Exception as e:
        logging.error(f"Application failed: {e}")