from PyPDF2 import PdfReader
from openpyxl import load_workbook
from docx import Document as DocxDocument
import pandas as pd
from transformers import pipeline
import os

class DocumentProcessor:
    def __init__(self):
        # Initialize the NER pipeline for sensitive information detection
        self.ner_pipeline = pipeline("ner", model="dslim/bert-base-NER")

    def extract_text(self, file_path: str) -> str:
        """Extract text content from various document formats"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_ext == '.xlsx':
            return self._extract_from_excel(file_path)
        elif file_ext == '.docx':
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    def _extract_from_excel(self, file_path: str) -> str:
        """Extract text from Excel file"""
        df = pd.read_excel(file_path)
        return df.to_string()

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        doc = DocxDocument(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    def detect_sensitive_info(self, text: str) -> dict:
        """
        Detect sensitive information in the text using NER and pattern matching
        Returns a dictionary of detected sensitive information
        """
        # Use NER to detect named entities
        ner_results = self.ner_pipeline(text)
        
        # Group entities by type
        entities = {}
        for result in ner_results:
            entity_type = result['entity']
            if entity_type not in entities:
                entities[entity_type] = []
            entities[entity_type].append({
                'text': result['word'],
                'score': result['score']
            })
        
        # Add additional sensitive information detection here
        # For example: credit card numbers, social security numbers, etc.
        
        return {
            'named_entities': entities,
            # Add other types of sensitive information here
        }
