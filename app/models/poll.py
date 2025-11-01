from sqlalchemy import Column, Integer, String, Boolean, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class BlogPoll(Base):
    __tablename__ = "blog_polls"
    
    id = Column(BigInteger, primary_key=True, index=True)
    question = Column(String(500), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")


class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(BigInteger, primary_key=True, index=True)
    poll_id = Column(BigInteger, ForeignKey("blog_polls.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String(200), nullable=False)
    vote_count = Column(BigInteger, default=0)
    
    # Relationships
    poll = relationship("BlogPoll", back_populates="options")
    votes = relationship("PollVote", back_populates="option", cascade="all, delete-orphan")


class PollVote(Base):
    __tablename__ = "poll_votes"
    
    id = Column(BigInteger, primary_key=True, index=True)
    poll_id = Column(BigInteger, ForeignKey("blog_polls.id", ondelete="CASCADE"), nullable=False)
    option_id = Column(BigInteger, ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    user_ip = Column(String(45))
    voted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    option = relationship("PollOption", back_populates="votes")
