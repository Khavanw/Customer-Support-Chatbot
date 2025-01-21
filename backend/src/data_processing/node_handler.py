import os
import json
from llama_index.core.node_parser import SentenceSplitter

def load_json_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading JSON data: {e}")
        return None

def Sentence_Splitter_docs_into_nodes(documents):
    try:
        splitter = SentenceSplitter(
            chunk_size=1500,
            chunk_overlap=200
        )
        nodes = splitter.get_nodes_from_documents(documents)
        return nodes
    except Exception as e:
        print(f"Error splitting documents into nodes: {e}")
        return []

def save_nodes(nodes, ouput_file):
    try:
        os.makedirs(os.path.dirname(ouput_file), exist_ok=True)
        nodes_data = {
            "data": []
        }

        for node in nodes:
            try: 
                # Parse nội dung json từ node
                content = json.loads(node.text)
                nodes_data["data"].append(content)
            except json.JSONDecodeError:
                print(f"Error parsing node text: {node.text[:100]}...")
        
        with open(ouput_file, 'w', encoding='utf-8') as file:
            json.dump(nodes_data, file, ensure_ascii=False, indent=4)
        print(f"Saved nodes to {ouput_file}")
    except Exception as e:
        print(f"Error saving nodes: {e}")
