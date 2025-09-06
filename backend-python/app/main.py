from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.document_processor import DocumentProcessor
from .database import get_db, Base, engine
from .models import Document
from typing import List
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF, XLSX, DOCX) and process it for sensitive information
    """
    allowed_types = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    }
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Save file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Process document
    processor = DocumentProcessor()
    text_content = processor.extract_text(file_path)
    sensitive_info = processor.detect_sensitive_info(text_content)
    
    # Save to database
    db = next(get_db())
    doc = Document(
        filename=file.filename,
        content=text_content,
        sensitive_info=sensitive_info
    )
    db.add(doc)
    db.commit()
    
    return {
        "filename": file.filename,
        "sensitive_info": sensitive_info
    }

@app.get("/documents")
def get_documents():
    """
    Get list of processed documents
    """
    db = next(get_db())
    documents = db.query(Document).all()
    return documents
