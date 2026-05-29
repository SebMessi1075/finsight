from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    transactions  = relationship("Transaction", back_populates="owner")
    uploads       = relationship("Upload", back_populates="owner")

class Upload(Base):
    __tablename__ = "uploads"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename      = Column(String)
    date_range    = Column(String)
    total_rows    = Column(Integer)
    uploaded_at   = Column(DateTime(timezone=True), server_default=func.now())
    owner         = relationship("User", back_populates="uploads")
    transactions  = relationship("Transaction", back_populates="upload")

class Transaction(Base):
    __tablename__ = "transactions"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    upload_id     = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    date          = Column(DateTime(timezone=True), nullable=False)
    description   = Column(String, nullable=False)
    amount        = Column(Float, nullable=False)
    type          = Column(String, nullable=False)   # 'Debit' | 'Credit'
    category      = Column(String)
    z_score       = Column(Float, default=0.0)
    z_flagged     = Column(Boolean, default=False)
    is_suspicious = Column(Boolean, default=False)
    owner         = relationship("User", back_populates="transactions")
    upload        = relationship("Upload", back_populates="transactions")