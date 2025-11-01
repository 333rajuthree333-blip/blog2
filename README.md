# AI-Powered Blog Website - Python FastAPI Version

Full-featured blog platform converted from Java Spring Boot to Python FastAPI for Vercel deployment.

## 🚀 Features

- ✨ **FastAPI Framework** - Modern, fast Python web framework
- 📝 **Rich Blog Management** - Create, edit, delete blog posts
- 🤖 **AI Content Generation** - OpenRouter/DeepSeek AI integration
- 🖼️ **Image Upload** - File upload and management
- 🔍 **Search & Filter** - Search posts, filter by tags
- 📊 **View Counter** - Track post views
- 🗄️ **PostgreSQL Database** - Neon Database integration
- 🌐 **Multi-language Support** - English, Bengali, Hindi
- 📱 **Responsive Frontend** - Modern UI with all original features

## 🛠️ Technology Stack

- **Backend**: Python 3.9+, FastAPI
- **Database**: PostgreSQL (Neon)
- **ORM**: SQLAlchemy
- **AI**: OpenRouter API (DeepSeek)
- **Deployment**: Vercel

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL database (Neon account)
- OpenRouter API key

## 🔧 Local Development Setup

### 1. Clone and Setup

```bash
cd python-blog
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` file:

```env
DATABASE_URL=postgresql://neondb_owner:npg_7uAziTVoml6R@ep-fragrant-sea-a1edrh7r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=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
CHATBOT_API_KEY=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
JWT_SECRET_KEY=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### 3. Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

## 🌐 Vercel Deployment

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd python-blog
vercel
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect FastAPI
6. Add environment variables
7. Deploy!

### Environment Variables on Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_neon_database_url
OPENROUTER_API_KEY=your_openrouter_key
CHATBOT_API_KEY=your_chatbot_key
JWT_SECRET_KEY=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

## 📚 API Endpoints

### Blog Posts

- `GET /api/posts` - Get all published posts (paginated)
- `GET /api/posts/{id}` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post
- `PATCH /api/posts/{id}/publish` - Toggle publish status
- `GET /api/posts/search?keyword=` - Search posts
- `GET /api/posts/tag/{tag}` - Get posts by tag
- `GET /api/posts/top` - Get top posts by views
- `GET /api/posts/stats` - Get statistics
- `POST /api/posts/generate` - Generate AI post

### File Upload

- `POST /api/upload/image` - Upload image
- `GET /api/upload/images/{filename}` - Get image
- `DELETE /api/upload/images/{filename}` - Delete image

## 🧪 Testing

```bash
# Run tests (if implemented)
pytest

# API testing with curl
curl http://localhost:8000/api/posts
```

## 📖 API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔒 Security

- JWT-based authentication ready
- Environment variables for secrets
- SQL injection prevention (SQLAlchemy)
- File upload validation
- CORS configuration

## 🚀 Production Checklist

- [ ] Set strong JWT_SECRET_KEY
- [ ] Change default admin password
- [ ] Configure CORS allowed origins
- [ ] Set up database backups
- [ ] Enable HTTPS (Vercel provides automatically)
- [ ] Monitor API usage
- [ ] Set up logging

## 📝 Conversion Notes

This project was converted from Java Spring Boot to Python FastAPI:

- Spring Boot → FastAPI
- JPA/Hibernate → SQLAlchemy
- Maven → pip
- @RestController → @router decorators
- All business logic preserved
- Same database schema
- Same API endpoints

## 🆘 Troubleshooting

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure SSL mode is set

### AI Generation Not Working
- Verify OPENROUTER_API_KEY is valid
- Check API quota
- Review logs in Vercel dashboard

### Build Failed on Vercel
- Check requirements.txt
- Verify Python version (3.9+)
- Review build logs

## 📞 Support

For issues:
- Check API docs: `/docs`
- Review logs: Vercel Dashboard
- Verify environment variables

## 📜 License

MIT License

---

**Built with ❤️ using FastAPI | Deployed on Vercel**
