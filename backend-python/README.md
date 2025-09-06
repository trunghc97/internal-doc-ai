# Document AI Backend

This Python backend service is responsible for processing documents (PDF, XLSX, DOCX) and detecting sensitive information using AI/ML techniques.

## Features

- Document upload and processing
- Text extraction from multiple document formats (PDF, XLSX, DOCX)
- Sensitive information detection using NER (Named Entity Recognition)
- PostgreSQL database integration
- RESTful API using FastAPI

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
POSTGRES_USER=docai_user
POSTGRES_PASSWORD=docai_password
POSTGRES_HOST=localhost
POSTGRES_DB=docai
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `POST /documents/upload`: Upload and process a document
- `GET /documents`: Get list of processed documents

## Docker

Build and run using Docker:

```bash
docker build -t docai-backend-python .
docker run -p 8081:8081 docai-backend-python
```

Or use docker-compose:

```bash
docker-compose up
```
