"""
Database configuration và connection setup cho PostgreSQL
"""

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from pydantic_settings import BaseSettings
from typing import Optional

class DatabaseSettings(BaseSettings):
    """Cấu hình database từ environment variables"""
    
    # PostgreSQL connection settings
    postgres_host: str = "postgres"  # Docker service name
    postgres_port: int = 5432
    postgres_user: str = "docai_user"
    postgres_password: str = "docai_password"
    postgres_db: str = "docai_db"
    
    # Connection pool settings
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        env_prefix = "DB_"

    @property
    def database_url(self) -> str:
        """Tạo database URL từ các thông số cấu hình"""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

# Khởi tạo settings
db_settings = DatabaseSettings()

# Tạo SQLAlchemy engine
engine = create_engine(
    db_settings.database_url,
    pool_size=db_settings.pool_size,
    max_overflow=db_settings.max_overflow,
    pool_timeout=db_settings.pool_timeout,
    pool_recycle=db_settings.pool_recycle,
    echo=db_settings.environment == "development",  # Log SQL queries trong dev
)

# Tạo SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tạo Base class cho models
Base = declarative_base()

# Metadata cho Alembic migrations
metadata = MetaData()

def get_db():
    """
    Dependency để lấy database session
    Sử dụng trong FastAPI dependency injection
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Tạo tất cả tables trong database"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Xóa tất cả tables trong database (chỉ dùng trong development)"""
    if db_settings.environment == "development":
        Base.metadata.drop_all(bind=engine)
    else:
        raise Exception("Cannot drop tables in production environment")

def test_connection() -> bool:
    """
    Test kết nối database
    Returns True nếu kết nối thành công, False nếu thất bại
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def get_database_info() -> dict:
    """Lấy thông tin về database"""
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT version()")
            version = result.fetchone()[0]
            
            return {
                "status": "connected",
                "database_url": db_settings.database_url.replace(db_settings.postgres_password, "***"),
                "postgres_version": version,
                "pool_size": db_settings.pool_size,
                "environment": db_settings.environment
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_url": db_settings.database_url.replace(db_settings.postgres_password, "***")
        }

# Context manager cho database sessions
class DatabaseSession:
    """Context manager để quản lý database sessions"""
    
    def __init__(self):
        self.db = None
    
    def __enter__(self):
        self.db = SessionLocal()
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.db.rollback()
        else:
            self.db.commit()
        self.db.close()

# Utility functions
def execute_raw_sql(sql: str, params: dict = None):
    """Thực thi raw SQL query"""
    with DatabaseSession() as db:
        result = db.execute(sql, params or {})
        return result.fetchall()

def check_table_exists(table_name: str) -> bool:
    """Kiểm tra xem table có tồn tại không"""
    try:
        with engine.connect() as connection:
            result = connection.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)",
                (table_name,)
            )
            return result.fetchone()[0]
    except Exception:
        return False
