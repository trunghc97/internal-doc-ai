from sqlalchemy import Column, BigInteger, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import Base

class DocumentRisk(Base):
    __tablename__ = 'documents_risk'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    content = Column(Text)
    document_id = Column(BigInteger, ForeignKey('documents.id'), nullable=False)
    risk_type = Column(Text)
    risk_key = Column(Text)

    # Relationship
    document = relationship("Document", back_populates="document_risks")

    def __init__(self, document_id: int, risk_type: str, risk_key: str, content: str = None):
        self.document_id = document_id
        self.risk_type = risk_type
        self.risk_key = risk_key
        self.content = content

    def __repr__(self):
        return f"<DocumentRisk(id={self.id}, document_id={self.document_id}, risk_type='{self.risk_type}')>"
