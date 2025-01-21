import json
from llama_index.core.schema import Document
from node_handler import load_json_data
from node_handler import Sentence_Splitter_docs_into_nodes
from node_handler import save_nodes

class CustomTransformation:
    def __call__(self, data):
        transformed_documents = []

        for qa_pair in data["data"]:
            content = {
                "question": qa_pair["question"],
                "answer": {
                    "description": qa_pair["answer"].get("description", ""),
                    "steps": qa_pair["answer"].get("steps", []),
                    "notes": qa_pair["answer"].get("notes", ""),
                    "images": qa_pair["answer"].get("images", {}),
                    "caption": qa_pair["answer"].get("images", {}).get("caption", ""),
                    "source": qa_pair["answer"].get("source", "")
                }
            }

            metadata = {
                "source": qa_pair.get("source"),
                "type": "qa_pair"
            }

            doc = Document(text=json.dumps(content, ensure_ascii=False), metadata=metadata)
            transformed_documents.append(doc)
        return transformed_documents


if __name__ == '__main__':
    try:
        input_file = r"backend/data/data.json"
        data = load_json_data(input_file)
        
        if data:
            custom_transform = CustomTransformation()
            documents = custom_transform(data)
            print(f"Created {len(documents)} documents")

            nodes = Sentence_Splitter_docs_into_nodes(documents)
            print(f"Created {len(nodes)} nodes")

            output_file = r"backend/data/node.json"
            save_nodes(nodes, output_file)
        else:
            print("No data to process.")

    except Exception as e:
        print(f"Error processing data: {e}")