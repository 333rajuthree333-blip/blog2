from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.blog_post import BlogPost, BlogPostTag, BlogPostImage
from app.schemas.blog_post import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostResponse,
    AIGenerateRequest
)
from app.services.blog_post_service import BlogPostService
from app.services.ai_service import AIService
from datetime import datetime

router = APIRouter()

@router.get("/posts", response_model=dict)
async def get_all_published_posts(
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    lang: str = Query("en"),
    db: Session = Depends(get_db)
):
    """Get all published blog posts with pagination"""
    service = BlogPostService(db)
    return await service.get_published_posts(page, size, sort_by, sort_dir, lang)


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_post_by_id(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get single blog post by ID and increment view count"""
    service = BlogPostService(db)
    post = await service.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    await service.increment_view_count(post_id)
    
    return post


@router.post("/posts", response_model=BlogPostResponse, status_code=201)
async def create_post(
    post_data: BlogPostCreate,
    db: Session = Depends(get_db)
):
    """Create a new blog post"""
    service = BlogPostService(db)
    return await service.create_post(post_data)


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: int,
    post_data: BlogPostUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing blog post"""
    service = BlogPostService(db)
    updated_post = await service.update_post(post_id, post_data)
    if not updated_post:
        raise HTTPException(status_code=404, detail="Post not found")
    return updated_post


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Delete a blog post"""
    service = BlogPostService(db)
    success = await service.delete_post(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return None


@router.patch("/posts/{post_id}/publish")
async def toggle_publish_status(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Toggle publish status of a blog post"""
    service = BlogPostService(db)
    post = await service.toggle_publish(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Publish status updated", "published": post.published}


@router.get("/posts/search", response_model=dict)
async def search_posts(
    keyword: str = Query(..., min_length=1),
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search posts by keyword"""
    service = BlogPostService(db)
    return await service.search_posts(keyword, page, size)


@router.get("/posts/tag/{tag}", response_model=dict)
async def get_posts_by_tag(
    tag: str,
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get posts by tag"""
    service = BlogPostService(db)
    return await service.get_posts_by_tag(tag, page, size)


@router.get("/posts/top", response_model=List[BlogPostResponse])
async def get_top_posts(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get top posts by view count"""
    service = BlogPostService(db)
    return await service.get_top_posts(limit)


@router.get("/posts/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get blog statistics"""
    service = BlogPostService(db)
    return await service.get_statistics()


@router.post("/posts/generate", response_model=BlogPostResponse, status_code=201)
async def generate_ai_post(
    request: AIGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate a blog post using AI"""
    ai_service = AIService()
    blog_service = BlogPostService(db)
    
    # Generate content using AI
    generated_content = await ai_service.generate_blog_post(request.prompt)
    
    # Create post data
    post_data = BlogPostCreate(
        title=generated_content["title"],
        content=generated_content["content"],
        excerpt=generated_content["excerpt"],
        author=request.author,
        tags=generated_content.get("tags", []),
        published=False
    )
    
    # Create post
    post = await blog_service.create_post(post_data)
    
    # Mark as AI generated
    post.is_ai_generated = True
    post.ai_prompt = request.prompt
    db.commit()
    db.refresh(post)
    
    return post


@router.post("/posts/{post_id}/images")
async def add_image_to_post(
    post_id: int,
    image_url: str,
    db: Session = Depends(get_db)
):
    """Add image URL to a post"""
    service = BlogPostService(db)
    success = await service.add_image(post_id, image_url)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Image added successfully"}


@router.patch("/posts/{post_id}/featured-image")
async def set_featured_image(
    post_id: int,
    image_url: str,
    db: Session = Depends(get_db)
):
    """Set featured image for a post"""
    service = BlogPostService(db)
    success = await service.set_featured_image(post_id, image_url)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Featured image updated successfully"}
