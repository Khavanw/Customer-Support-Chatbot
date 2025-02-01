﻿# ASC Chatbot - A customer support chatbot using LLM + Document Retriever (RAG) in Vietnamese

## 📝 Project Description
The **Customer Support Chatbot** is an automated customer support system built using **Retrieval-Augmented Generation (RAG)** architecture combined with **Gemini LLM** and **LlamaIndex**. This chatbot is designed to enhance customer support efficiency, reduce operational costs, and improve the accuracy of responses to customer queries.

## 🎯 Objectives
- **Reduce** support team size by **30%** through automated customer query handling.
- **Lower API costs** by **40%** using a combination of **semantic embeddings** and **keyword filtering**.
- Achieve **85% retrieval accuracy** and **95% uptime**, with response times under **5 second**.

## 🛠 Technologies Used
- **Programming Language**: Python
- **AI Models**: Gemini LLM, RAG Architecture, LlamaIndex
- **Natural Language Processing (NLP)**: Sentence-Transformers
- **Embedding Model**: ASC Embedding (Fine-tuned)
- **Sparese Model**: Qdrant/bm42-all-minilm-l6-v2-attentions (HuggingFace)
- **Rerank Model**: cross-encoder/ms-marco-MiniLM-L-6-v2 (HuggingFace)
- **Vector Database**: Qdrant
- **Backend**: FastAPI, Docker
- **Deployment**: RESTful APIs, Docker Container
- **Other Tools**: Git, Postman

## Workflow
![WorkFlow](Workflow/WorkFlow_Chatbot.png)

## Demo
- Video Demo: https://storage.googleapis.com/ascchatbot/source/ASC.mp4
- Live front-end (no server): https://khavanw.github.io/Customer-Support-Chatbot/ 
- Homepage
![Homepage](demo/Homepage.png)
- Chatbot
![Chatbot](demo/Chatbot.png)
![Chatbot1](demo/Chatbot1.png)
![Chatbot2](demo/Chatbot2.png)

## 🚀 Key Features

- 🔹 **Multi-Source Data Support**  
  - The chatbot can process data from various formats, including **PDF, Word, and Excel**.  
  - Data is **chunked** and converted into **JSON format** for efficient processing.  

- 🔹 **Dual Embedding System**  
  - Uses **semantic embeddings** (fine-tuned model) and **sparse embeddings** (keyword matching) to enhance search accuracy.  
  - **Embedding Model**: [ASC_Embedding](https://huggingface.co/vankha/asc_embedding) is fine-tuned to match project-specific data.  

- 🔹 **Hybrid Search Mechanism**  
  - Combines **semantic search** and **keyword search** for optimized query results.  
  - Utilizes a **reranking model** to improve result accuracy.  

- 🔹 **Gemini LLM Integration**  
  - Leverages **Gemini 1.5** with custom **prompt templates** for generating natural and precise responses.  

- 🔹 **Easy Deployment**  
  - The application is **containerized using Docker** and deployed as **RESTful APIs** with **FastAPI**.  

