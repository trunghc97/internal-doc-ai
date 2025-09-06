"""
Service để lưu trữ và quản lý dữ liệu nhạy cảm trong database
Cập nhật để sử dụng schema mới
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import time

from ..config.database import get_db, DatabaseSession
from ..models.sensitive_data import (
    User, Document, DocumentRisk, DocumentStatus, RiskType,
    DocumentProcessor, get_risk_level
)

class DatabaseService:
    """Service class để quản lý database operations với schema mới"""
    
    def __init__(self):
        pass
    
    def save_document_analysis(
        self,
        filename: str,
        mime_type: str,
        content_text: str,
        detection_result: Dict[str, Any],
        file_size: int,
        owner_user_id: int = 1,  # Default user ID, có thể thay đổi
        uploaded_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Lưu kết quả phân tích document vào database với schema mới
        
        Args:
            filename: Tên file
            mime_type: MIME type của file
            content_text: Nội dung text đã extract
            detection_result: Kết quả từ hàm find_sensitive_info()
            file_size: Kích thước file (bytes)
            owner_user_id: ID của user sở hữu document
            uploaded_by: Người upload (optional)
            
        Returns:
            Dict chứa thông tin document đã lưu và thống kê
        """
        start_time = time.time()
        
        try:
            with DatabaseSession() as db:
                # 1. Đảm bảo user tồn tại (tạo default user nếu cần)
                user = db.query(User).filter(User.id == owner_user_id).first()
                if not user:
                    user = User(
                        id=owner_user_id,
                        username=uploaded_by or "default_user",
                        email=f"{uploaded_by or 'default'}@example.com",
                        full_name=uploaded_by or "Default User"
                    )
                    db.add(user)
                    db.flush()
                
                # 2. Tính toán risk score
                regex_results = detection_result.get("regex_detection", [])
                risk_score = DocumentProcessor.calculate_risk_score(regex_results)
                status = DocumentProcessor.determine_status(risk_score)
                
                # 3. Tạo sensitive_info JSON
                sensitive_info_json = DocumentProcessor.create_sensitive_info_json(detection_result)
                
                # 4. Tạo Document record
                document = Document(
                    filename=filename,
                    mime_type=mime_type,
                    file_size=file_size,
                    content=content_text,
                    sensitive_info=sensitive_info_json,
                    risk_score=risk_score,
                    status=status,
                    owner_user_id=owner_user_id,
                    uploaded_at=datetime.utcnow(),
                    last_modified_at=datetime.utcnow()
                )
                
                db.add(document)
                db.flush()  # Để lấy document.id
                
                # 5. Tạo DocumentRisk records cho từng sensitive item
                document_risks = []
                
                # Từ regex detection
                for item in regex_results:
                    risk_type = DocumentProcessor.map_detection_to_risk_type(item["type"])
                    
                    document_risk = DocumentRisk(
                        document_id=document.id,
                        risk_type=risk_type,
                        risk_key=item["type"],
                        content=item["value"]
                    )
                    document_risks.append(document_risk)
                    db.add(document_risk)
                
                # Từ AI classification
                ai_result = detection_result.get("ai_classification", {})
                ai_details = ai_result.get("details", [])
                
                for detail in ai_details:
                    # Tạo risk record cho mỗi AI detection
                    document_risk = DocumentRisk(
                        document_id=document.id,
                        risk_type=RiskType.CONFIDENTIAL_DATA.value,  # Default cho AI detection
                        risk_key=detail["type"],
                        content=", ".join(detail["matches"])
                    )
                    document_risks.append(document_risk)
                    db.add(document_risk)
                
                db.commit()
                
                processing_time = int((time.time() - start_time) * 1000)
                
                return {
                    "success": True,
                    "document_id": document.id,
                    "filename": filename,
                    "risk_score": float(risk_score),
                    "risk_level": get_risk_level(risk_score),
                    "status": status,
                    "total_risks": len(document_risks),
                    "regex_detections": len(regex_results),
                    "ai_detections": len(ai_details),
                    "processing_time_ms": processing_time
                }
                
        except SQLAlchemyError as e:
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def get_document_analysis(self, document_id: int) -> Optional[Dict[str, Any]]:
        """Lấy kết quả phân tích của document"""
        try:
            with DatabaseSession() as db:
                document = db.query(Document).filter(Document.id == document_id).first()
                if not document:
                    return None
                
                # Lấy document risks
                document_risks = db.query(DocumentRisk).filter(
                    DocumentRisk.document_id == document_id
                ).all()
                
                # Parse sensitive_info JSON
                sensitive_info = {}
                if document.sensitive_info:
                    try:
                        sensitive_info = json.loads(document.sensitive_info)
                    except json.JSONDecodeError:
                        sensitive_info = {"error": "Invalid JSON"}
                
                return {
                    "document": {
                        "id": document.id,
                        "filename": document.filename,
                        "mime_type": document.mime_type,
                        "file_size": document.file_size,
                        "status": document.status,
                        "risk_score": float(document.risk_score) if document.risk_score else 0.0,
                        "risk_level": get_risk_level(float(document.risk_score) if document.risk_score else 0.0),
                        "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None,
                        "last_modified_at": document.last_modified_at.isoformat() if document.last_modified_at else None,
                        "content_length": len(document.content) if document.content else 0
                    },
                    "sensitive_info": sensitive_info,
                    "risks": [
                        {
                            "id": risk.id,
                            "risk_type": risk.risk_type,
                            "risk_key": risk.risk_key,
                            "content": risk.content
                        }
                        for risk in document_risks
                    ],
                    "summary": {
                        "total_risks": len(document_risks),
                        "risk_types": list(set([risk.risk_type for risk in document_risks if risk.risk_type])),
                        "risk_keys": list(set([risk.risk_key for risk in document_risks if risk.risk_key]))
                    }
                }
        except Exception as e:
            return {"error": str(e)}
    
    def get_documents_summary(self, limit: int = 50, owner_user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách documents với thông tin tóm tắt"""
        try:
            with DatabaseSession() as db:
                query = db.query(Document).order_by(Document.uploaded_at.desc())
                
                if owner_user_id:
                    query = query.filter(Document.owner_user_id == owner_user_id)
                
                documents = query.limit(limit).all()
                
                result = []
                for doc in documents:
                    # Đếm số risks
                    risk_count = db.query(DocumentRisk).filter(
                        DocumentRisk.document_id == doc.id
                    ).count()
                    
                    result.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "mime_type": doc.mime_type,
                        "file_size": doc.file_size,
                        "status": doc.status,
                        "risk_score": float(doc.risk_score) if doc.risk_score else 0.0,
                        "risk_level": get_risk_level(float(doc.risk_score) if doc.risk_score else 0.0),
                        "total_risks": risk_count,
                        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
                        "owner_user_id": doc.owner_user_id
                    })
                
                return result
        except Exception as e:
            return [{"error": str(e)}]
    
    def get_statistics(self, owner_user_id: Optional[int] = None) -> Dict[str, Any]:
        """Lấy thống kê tổng quan"""
        try:
            with DatabaseSession() as db:
                # Base queries
                doc_query = db.query(Document)
                risk_query = db.query(DocumentRisk)
                
                if owner_user_id:
                    doc_query = doc_query.filter(Document.owner_user_id == owner_user_id)
                    risk_query = risk_query.join(Document).filter(Document.owner_user_id == owner_user_id)
                
                # Document statistics
                total_docs = doc_query.count()
                completed_docs = doc_query.filter(Document.status == DocumentStatus.COMPLETED.value).count()
                processing_docs = doc_query.filter(Document.status == DocumentStatus.PROCESSING.value).count()
                error_docs = doc_query.filter(Document.status == DocumentStatus.ERROR.value).count()
                
                # Risk statistics
                total_risks = risk_query.count()
                
                # Risk level distribution
                risk_levels = {"none": 0, "low": 0, "medium": 0, "high": 0, "critical": 0}
                for doc in doc_query.all():
                    risk_score = float(doc.risk_score) if doc.risk_score else 0.0
                    level = get_risk_level(risk_score)
                    risk_levels[level] += 1
                
                # Risk type distribution
                risk_type_stats = {}
                risk_types = risk_query.with_entities(DocumentRisk.risk_type).distinct().all()
                for (risk_type,) in risk_types:
                    if risk_type:
                        count = risk_query.filter(DocumentRisk.risk_type == risk_type).count()
                        risk_type_stats[risk_type] = count
                
                # Average risk score
                avg_risk_score = 0.0
                if total_docs > 0:
                    total_score = sum([
                        float(doc.risk_score) if doc.risk_score else 0.0 
                        for doc in doc_query.all()
                    ])
                    avg_risk_score = total_score / total_docs
                
                return {
                    "documents": {
                        "total": total_docs,
                        "completed": completed_docs,
                        "processing": processing_docs,
                        "error": error_docs
                    },
                    "risks": {
                        "total": total_risks,
                        "average_per_document": round(total_risks / total_docs, 2) if total_docs > 0 else 0
                    },
                    "risk_levels": risk_levels,
                    "risk_types": risk_type_stats,
                    "average_risk_score": round(avg_risk_score, 2)
                }
        except Exception as e:
            return {"error": str(e)}
    
    def create_user_if_not_exists(self, user_id: int, username: str, email: str, full_name: str = None) -> Dict[str, Any]:
        """Tạo user nếu chưa tồn tại"""
        try:
            with DatabaseSession() as db:
                existing_user = db.query(User).filter(User.id == user_id).first()
                
                if existing_user:
                    return {
                        "success": True,
                        "user_id": existing_user.id,
                        "message": "User already exists"
                    }
                
                new_user = User(
                    id=user_id,
                    username=username,
                    email=email,
                    full_name=full_name or username
                )
                
                db.add(new_user)
                db.commit()
                
                return {
                    "success": True,
                    "user_id": new_user.id,
                    "message": "User created successfully"
                }
                
        except SQLAlchemyError as e:
            return {
                "success": False,
                "error": f"Database error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def get_user_documents(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy danh sách documents của một user"""
        return self.get_documents_summary(limit=limit, owner_user_id=user_id)
    
    def update_document_status(self, document_id: int, status: str) -> Dict[str, Any]:
        """Cập nhật status của document"""
        try:
            with DatabaseSession() as db:
                document = db.query(Document).filter(Document.id == document_id).first()
                
                if not document:
                    return {"success": False, "error": "Document not found"}
                
                document.status = status
                document.last_modified_at = datetime.utcnow()
                
                db.commit()
                
                return {
                    "success": True,
                    "document_id": document_id,
                    "new_status": status
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}

# Khởi tạo service instance
database_service = DatabaseService()

# Wrapper functions để sử dụng dễ dàng
def save_document_analysis(*args, **kwargs):
    """Wrapper function để sử dụng dễ dàng"""
    return database_service.save_document_analysis(*args, **kwargs)

def get_document_analysis(document_id: int):
    """Wrapper function để lấy analysis"""
    return database_service.get_document_analysis(document_id)

def get_documents_summary(limit: int = 50, owner_user_id: Optional[int] = None):
    """Wrapper function để lấy danh sách documents"""
    return database_service.get_documents_summary(limit, owner_user_id)

def get_statistics(owner_user_id: Optional[int] = None):
    """Wrapper function để lấy thống kê"""
    return database_service.get_statistics(owner_user_id)

def create_user_if_not_exists(user_id: int, username: str, email: str, full_name: str = None):
    """Wrapper function để tạo user"""
    return database_service.create_user_if_not_exists(user_id, username, email, full_name)

def get_user_documents(user_id: int, limit: int = 50):
    """Wrapper function để lấy documents của user"""
    return database_service.get_user_documents(user_id, limit)
