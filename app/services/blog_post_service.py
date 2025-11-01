from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, or_
from app.models.blog_post import BlogPost, BlogPostTag, BlogPostImage
from app.schemas.blog_post import BlogPostCreate, BlogPostUpdate
from typing import Optional, List
from datetime import datetime
import math

class BlogPostService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_published_posts(self, page: int, size: int, sort_by: str, sort_dir: str, lang: str = "en"):
        """Get paginated published posts"""
        # Query published posts
        query = self.db.query(BlogPost).filter(BlogPost.published == True)
        
        # Apply sorting
        if sort_dir.lower() == "asc":
            query = query.order_by(asc(getattr(BlogPost, sort_by, BlogPost.created_at)))
        else:
            query = query.order_by(desc(getattr(BlogPost, sort_by, BlogPost.created_at)))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        posts = query.offset(page * size).limit(size).all()
        
        # Convert to dict
        content = []
        for post in posts:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "excerpt": post.excerpt or post.generate_excerpt(),
                "author": post.author,
                "featured_image": post.featured_image,
                "published": post.published,
                "view_count": post.view_count,
                "is_ai_generated": post.is_ai_generated,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "published_at": post.published_at
            }
            
            # Get tags
            tags = self.db.query(BlogPostTag.tag).filter(BlogPostTag.post_id == post.id).all()
            post_dict["tags"] = [tag[0] for tag in tags]
            
            content.append(post_dict)
        
        return {
            "content": content,
            "page": page,
            "size": size,
            "total_elements": total,
            "total_pages": math.ceil(total / size) if size > 0 else 0
        }
    
    async def get_post_by_id(self, post_id: int) -> Optional[BlogPost]:
        """Get post by ID"""
        return self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
    
    async def increment_view_count(self, post_id: int):
        """Increment view count"""
        post = await self.get_post_by_id(post_id)
        if post:
            post.view_count += 1
            self.db.commit()
    
    async def create_post(self, post_data: BlogPostCreate) -> BlogPost:
        """Create new blog post"""
        # Create post
        post = BlogPost(
            title=post_data.title,
            content=post_data.content,
            excerpt=post_data.excerpt,
            author=post_data.author,
            featured_image=post_data.featured_image,
            published=post_data.published,
            created_at=datetime.utcnow()
        )
        
        # Generate excerpt if not provided
        if not post.excerpt:
            post.excerpt = post.generate_excerpt()
        
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        
        # Add tags
        for tag in post_data.tags:
            post_tag = BlogPostTag(post_id=post.id, tag=tag)
            self.db.add(post_tag)
        
        self.db.commit()
        return post
    
    async def update_post(self, post_id: int, post_data: BlogPostUpdate) -> Optional[BlogPost]:
        """Update blog post"""
        post = await self.get_post_by_id(post_id)
        if not post:
            return None
        
        # Update fields
        update_data = post_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key != "tags":
                setattr(post, key, value)
        
        # Update tags if provided
        if post_data.tags is not None:
            # Delete old tags
            self.db.query(BlogPostTag).filter(BlogPostTag.post_id == post_id).delete()
            # Add new tags
            for tag in post_data.tags:
                post_tag = BlogPostTag(post_id=post.id, tag=tag)
                self.db.add(post_tag)
        
        post.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(post)
        return post
    
    async def delete_post(self, post_id: int) -> bool:
        """Delete blog post"""
        post = await self.get_post_by_id(post_id)
        if not post:
            return False
        
        self.db.delete(post)
        self.db.commit()
        return True
    
    async def toggle_publish(self, post_id: int) -> Optional[BlogPost]:
        """Toggle publish status"""
        post = await self.get_post_by_id(post_id)
        if not post:
            return None
        
        post.published = not post.published
        if post.published and not post.published_at:
            post.published_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(post)
        return post
    
    async def search_posts(self, keyword: str, page: int, size: int):
        """Search posts by keyword"""
        query = self.db.query(BlogPost).filter(
            BlogPost.published == True,
            or_(
                BlogPost.title.ilike(f"%{keyword}%"),
                BlogPost.content.ilike(f"%{keyword}%"),
                BlogPost.excerpt.ilike(f"%{keyword}%")
            )
        )
        
        total = query.count()
        posts = query.order_by(desc(BlogPost.created_at)).offset(page * size).limit(size).all()
        
        return {
            "content": posts,
            "total": total,
            "page": page,
            "size": size
        }
    
    async def get_posts_by_tag(self, tag: str, page: int, size: int):
        """Get posts by tag"""
        post_ids = self.db.query(BlogPostTag.post_id).filter(BlogPostTag.tag == tag).all()
        post_ids = [pid[0] for pid in post_ids]
        
        query = self.db.query(BlogPost).filter(
            BlogPost.id.in_(post_ids),
            BlogPost.published == True
        )
        
        total = query.count()
        posts = query.order_by(desc(BlogPost.created_at)).offset(page * size).limit(size).all()
        
        return {
            "content": posts,
            "total": total,
            "page": page,
            "size": size
        }
    
    async def get_top_posts(self, limit: int) -> List[BlogPost]:
        """Get top posts by view count"""
        return self.db.query(BlogPost).filter(
            BlogPost.published == True
        ).order_by(desc(BlogPost.view_count)).limit(limit).all()
    
    async def get_statistics(self):
        """Get blog statistics"""
        total_posts = self.db.query(func.count(BlogPost.id)).scalar()
        published_posts = self.db.query(func.count(BlogPost.id)).filter(BlogPost.published == True).scalar()
        total_views = self.db.query(func.sum(BlogPost.view_count)).scalar() or 0
        
        return {
            "total_posts": total_posts,
            "published_posts": published_posts,
            "draft_posts": total_posts - published_posts,
            "total_views": total_views
        }
    
    async def add_image(self, post_id: int, image_url: str) -> bool:
        """Add image to post"""
        post = await self.get_post_by_id(post_id)
        if not post:
            return False
        
        post_image = BlogPostImage(post_id=post_id, image_url=image_url)
        self.db.add(post_image)
        self.db.commit()
        return True
    
    async def set_featured_image(self, post_id: int, image_url: str) -> bool:
        """Set featured image"""
        post = await self.get_post_by_id(post_id)
        if not post:
            return False
        
        post.featured_image = image_url
        self.db.commit()
        return True
