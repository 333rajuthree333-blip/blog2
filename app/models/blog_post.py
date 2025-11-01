from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime

class BlogPost(Base):
    __tablename__ = "blog_posts"
    
    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500))
    
    # Multi-language support
    title_bn = Column(String(200))
    content_bn = Column(Text)
    excerpt_bn = Column(String(500))
    title_hi = Column(String(200))
    content_hi = Column(Text)
    excerpt_hi = Column(String(500))
    
    author = Column(String(100))
    featured_image = Column(String(500))
    published = Column(Boolean, default=False, nullable=False)
    view_count = Column(BigInteger, default=0)
    is_ai_generated = Column(Boolean, default=False)
    ai_prompt = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    tags = relationship("BlogPostTag", back_populates="post", cascade="all, delete-orphan")
    images = relationship("BlogPostImage", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("BlogComment", back_populates="post", cascade="all, delete-orphan")
    
    def generate_excerpt(self):
        """Generate excerpt from content if not provided"""
        if not self.excerpt and self.content:
            if len(self.content) > 200:
                return self.content[:197] + "..."
            return self.content
        return self.excerpt


class BlogPostTag(Base):
    __tablename__ = "blog_post_tags"
    
    id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(100), nullable=False)
    
    # Relationship
    post = relationship("BlogPost", back_populates="tags")


class BlogPostImage(Base):
    __tablename__ = "blog_post_images"
    
    id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    
    # Relationship
    post = relationship("BlogPost", back_populates="images")
