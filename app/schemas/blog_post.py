from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BlogPostBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    content: str = Field(..., min_length=10)
    excerpt: Optional[str] = None
    author: Optional[str] = None
    tags: List[str] = []
    featured_image: Optional[str] = None
    published: bool = False

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10)
    excerpt: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    published: Optional[bool] = None

class BlogPostResponse(BlogPostBase):
    id: int
    view_count: int = 0
    is_ai_generated: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10)
    author: Optional[str] = "AI Assistant"
