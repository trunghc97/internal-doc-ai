#!/usr/bin/env python3
"""
Script để setup database PostgreSQL cho hệ thống
"""

import sys
import os
from pathlib import Path

# Add app to path
sys.path.append(str(Path(__file__).parent))

from app.config.database import (
    test_connection, create_tables, get_database_info, 
    db_settings, engine
)
from app.models.sensitive_data import User, Document, DocumentRisk
from app.config.database import DatabaseSession

def setup_database():
    """Setup database và tạo dữ liệu mẫu"""
    
    print("🚀 SETUP DATABASE CHO HỆ THỐNG PHÁT HIỆN DỮ LIỆU NHẠY CẢM")
    print("=" * 60)
    
    # 1. Test connection
    print("🔌 Kiểm tra kết nối database...")
    print(f"   Database URL: {db_settings.database_url.replace(db_settings.postgres_password, '***')}")
    
    if not test_connection():
        print("❌ Không thể kết nối database!")
        print("📝 Hãy đảm bảo:")
        print("   - PostgreSQL đang chạy")
        print("   - Database credentials đúng")
        print("   - Database đã được tạo")
        return False
    
    print("✅ Kết nối database thành công!")
    
    # 2. Create tables
    print("\n📊 Tạo database tables...")
    try:
        create_tables()
        print("✅ Tables đã được tạo thành công!")
    except Exception as e:
        print(f"❌ Lỗi tạo tables: {str(e)}")
        return False
    
    # 3. Insert sample users
    print("\n👥 Thêm users mẫu...")
    try:
        insert_sample_data_types()
        print("✅ Users mẫu đã được thêm!")
    except Exception as e:
        print(f"❌ Lỗi thêm users mẫu: {str(e)}")
    
    # 4. Show database info
    print("\n📋 Thông tin database:")
    db_info = get_database_info()
    for key, value in db_info.items():
        print(f"   {key}: {value}")
    
    print("\n✅ SETUP HOÀN THÀNH!")
    print("\n🎯 Bước tiếp theo:")
    print("   1. Chạy ứng dụng: uvicorn app.main:app --reload")
    print("   2. Test API: http://localhost:8000/docs")
    print("   3. Kiểm tra database: http://localhost:8000/database/info")
    
    return True

def insert_sample_data_types():
    """Thêm user mẫu vào database"""
    
    with DatabaseSession() as db:
        # Tạo default user nếu chưa tồn tại
        existing_user = db.query(User).filter(User.id == 1).first()
        
        if not existing_user:
            default_user = User(
                id=1,
                username="default_user",
                email="default@example.com",
                full_name="Default User",
                is_active=True
            )
            db.add(default_user)
            print("✅ Đã tạo default user")
        else:
            print("ℹ️ Default user đã tồn tại")
        
        # Tạo admin user
        existing_admin = db.query(User).filter(User.id == 2).first()
        
        if not existing_admin:
            admin_user = User(
                id=2,
                username="admin",
                email="admin@example.com",
                full_name="Administrator",
                is_active=True
            )
            db.add(admin_user)
            print("✅ Đã tạo admin user")
        else:
            print("ℹ️ Admin user đã tồn tại")
        
        db.commit()

def create_database_if_not_exists():
    """Tạo database nếu chưa tồn tại"""
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    
    try:
        # Connect to postgres database to create our database
        conn = psycopg2.connect(
            host=db_settings.postgres_host,
            port=db_settings.postgres_port,
            user=db_settings.postgres_user,
            password=db_settings.postgres_password,
            database="postgres"  # Connect to default postgres db
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s",
            (db_settings.postgres_db,)
        )
        
        if not cursor.fetchone():
            cursor.execute(f'CREATE DATABASE "{db_settings.postgres_db}"')
            print(f"✅ Database '{db_settings.postgres_db}' đã được tạo!")
        else:
            print(f"ℹ️ Database '{db_settings.postgres_db}' đã tồn tại")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Lỗi tạo database: {str(e)}")
        return False

def main():
    """Main function"""
    print("Bạn có muốn tạo database nếu chưa tồn tại? (y/n): ", end="")
    create_db = input().lower().strip() == 'y'
    
    if create_db:
        print("\n📊 Tạo database...")
        if not create_database_if_not_exists():
            return
    
    # Setup database
    setup_database()

if __name__ == "__main__":
    main()
