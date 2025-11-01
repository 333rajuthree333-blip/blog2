from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class BlogComment(Base):
    __tablename__ = "blog_comments"
    
    id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    parent_id = Column(BigInteger, ForeignKey("blog_comments.id", ondelete="CASCADE"))
    
    content = Column(Text, nullable=False)
    author_name = Column(String(100))
    author_email = Column(String(100))
    approved = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    post = relationship("BlogPost", back_populates="comments")
    replies = relationship("BlogComment", remote_side=[id])
