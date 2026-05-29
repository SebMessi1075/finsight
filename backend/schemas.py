from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TransactionOut(BaseModel):
    id: int
    date: datetime
    description: str
    amount: float
    type: str
    category: Optional[str]
    z_flagged: bool
    is_suspicious: bool
    model_config = {"from_attributes": True}

class UploadOut(BaseModel):
    id: int
    filename: Optional[str]
    date_range: Optional[str]
    total_rows: Optional[int]
    uploaded_at: datetime
    model_config = {"from_attributes": True}