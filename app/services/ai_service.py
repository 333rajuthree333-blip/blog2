import httpx
from app.core.config import settings
import json

class AIService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
    
    async def generate_blog_post(self, prompt: str) -> dict:
        """Generate blog post using OpenRouter AI"""
        
        system_prompt = """You are a professional blog writer. Generate a well-structured blog post based on the user's prompt.
        Return ONLY a valid JSON object with the following structure:
        {
            "title": "Blog post title",
            "content": "Full blog post content (800-1200 words, use markdown formatting)",
            "excerpt": "Brief summary (150-200 characters)",
            "tags": ["tag1", "tag2", "tag3"]
        }"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek/deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            try:
                # Try to extract JSON from markdown code blocks
                if "```json" in content:
                    json_str = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    json_str = content.split("```")[1].split("```")[0].strip()
                else:
                    json_str = content.strip()
                
                generated = json.loads(json_str)
                
                # Validate required fields
                if "title" not in generated:
                    generated["title"] = "AI Generated Blog Post"
                if "content" not in generated:
                    generated["content"] = content
                if "excerpt" not in generated:
                    generated["excerpt"] = generated["content"][:200]
                if "tags" not in generated:
                    generated["tags"] = []
                
                return generated
                
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "title": "AI Generated Blog Post",
                    "content": content,
                    "excerpt": content[:200] if len(content) > 200 else content,
                    "tags": []
                }
