from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, BigInteger, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.config.database import Base

class Document(Base):
    __tablename__ = 'documents'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    content = Column(Text)
    file_size = Column(BigInteger, nullable=False)
    filename = Column(String(255), nullable=False, index=True)
    last_modified_at = Column(DateTime(timezone=True), nullable=False)
    mime_type = Column(String(255), nullable=False)
    sensitive_info = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), nullable=False)
    owner_user_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    risk_score = Column(Numeric(10))
    status = Column(Text)

    # Relationships
    owner = relationship("User", back_populates="documents")
    document_risks = relationship("DocumentRisk", back_populates="document")
    shared_with = relationship("DocumentShare", back_populates="document")

    def __init__(self, filename: str, file_size: int, mime_type: str, owner_user_id: int, content: str = None, sensitive_info: str = None):
        self.filename = filename
        self.file_size = file_size
        self.mime_type = mime_type
        self.owner_user_id = owner_user_id
        self.content = content
        self.sensitive_info = sensitive_info
        self.uploaded_at = datetime.now()
        self.last_modified_at = datetime.now()
        self.status = 'PENDING'  # Default status

    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.filename}', owner_user_id={self.owner_user_id})>"
