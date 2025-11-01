from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Page(Base):
    __tablename__ = "pages"
    
    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    content = Column(Text, nullable=False)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
