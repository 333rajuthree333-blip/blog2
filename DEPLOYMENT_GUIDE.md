# 🚀 Vercel Deployment Guide - Python FastAPI Blog

## ✅ সব প্রস্তুত! এখন Vercel এ Deploy করুন

### 📋 Prerequisites

- Vercel account (free)
- GitHub account
- আপনার Neon Database credentials
- OpenRouter API keys

---

## 🌐 Method 1: Vercel CLI (সবচেয়ে দ্রুত)

### Step 1: Vercel CLI Install করুন

```bash
npm install -g vercel
```

### Step 2: Login করুন

```bash
vercel login
```

Browser খুলবে, Vercel account দিয়ে login করুন।

### Step 3: Deploy করুন

```bash
cd python-blog
vercel
```

প্রশ্ন আসলে:
- **Set up and deploy?** → Yes
- **Which scope?** → আপনার account select করুন
- **Link to existing project?** → No
- **Project name?** → `blog-website` (অথবা আপনার পছন্দ)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### Step 4: Environment Variables Add করুন

```bash
vercel env add DATABASE_URL
# Paste: postgresql://neondb_owner:npg_7uAziTVoml6R@ep-fragrant-sea-a1edrh7r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

vercel env add OPENROUTER_API_KEY
# Paste: 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

vercel env add CHATBOT_API_KEY
# Paste: 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

vercel env add JWT_SECRET_KEY
# Paste: your-secure-jwt-secret-2024

vercel env add ADMIN_USERNAME
# Paste: admin

vercel env add ADMIN_PASSWORD
# Paste: SecurePassword123
```

### Step 5: Production Deploy

```bash
vercel --prod
```

✅ Done! আপনার website live: `https://blog-website.vercel.app`

---

## 🐙 Method 2: GitHub + Vercel Dashboard (Recommended)

### Step 1: GitHub Repository তৈরি করুন

```bash
cd python-blog
git init
git add .
git commit -m "Python FastAPI blog website for Vercel"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Vercel Dashboard এ যান

1. https://vercel.com/dashboard খুলুন
2. **"Add New..."** → **"Project"** ক্লিক করুন
3. **"Import Git Repository"** সিলেক্ট করুন
4. আপনার GitHub repository খুঁজুন এবং **"Import"** করুন

### Step 3: Project Configuration

Vercel automatically detect করবে:
- ✅ Framework: **Other**
- ✅ Build Command: (auto)
- ✅ Output Directory: (auto)

**"Deploy"** ক্লিক করুন (এখনও deploy হবে না, environment variables লাগবে)

### Step 4: Environment Variables Add করুন

Dashboard এ **"Settings"** → **"Environment Variables"** যান:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_7uAziTVoml6R@ep-fragrant-sea-a1edrh7r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `OPENROUTER_API_KEY` | `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` |
| `CHATBOT_API_KEY` | `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` |
| `JWT_SECRET_KEY` | `your-secure-jwt-secret-change-this-2024` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `SecurePassword123` |

প্রতিটি variable এর জন্য:
1. **Name** field এ variable name লিখুন
2. **Value** field এ value paste করুন
3. **Environment** → সব select করুন (Production, Preview, Development)
4. **"Add"** ক্লিক করুন

### Step 5: Redeploy করুন

**"Deployments"** tab → সবচেয়ে recent deployment → **"⋯"** → **"Redeploy"**

---

## 🔍 Deployment Verification

Deploy শেষ হলে:

### 1. Website Check করুন

```
https://your-project-name.vercel.app
```

### 2. API Docs দেখুন

```
https://your-project-name.vercel.app/docs
```

### 3. Health Check

```
https://your-project-name.vercel.app/health
```

Response: `{"status": "healthy"}`

### 4. Test API

```bash
# Get all posts
curl https://your-project-name.vercel.app/api/posts

# Get stats
curl https://your-project-name.vercel.app/api/posts/stats
```

---

## 🐛 Troubleshooting

### ❌ Build Failed

**Error**: `No Python version specified`

**Solution**: Ensure `runtime.txt` exists with `python-3.9`

---

**Error**: `Module not found`

**Solution**: Check `requirements.txt` - সব dependencies আছে কিনা

---

### ❌ 500 Internal Server Error

**Error**: Database connection failed

**Solution**: 
1. Vercel Dashboard → Environment Variables চেক করুন
2. `DATABASE_URL` সঠিক আছে কিনা verify করুন
3. Neon database active আছে কিনা check করুন

---

**Error**: `Application startup failed`

**Solution**: Vercel Logs দেখুন:
- Dashboard → Deployments → Latest → View Function Logs
- Error message দেখে fix করুন

---

### ❌ CORS Error

**Solution**: `app/core/config.py` এ `ALLOWED_ORIGINS` update করুন

---

### ❌ AI Generation Not Working

**Solution**: 
- `OPENROUTER_API_KEY` valid কিনা check করুন
- API quota আছে কিনা verify করুন

---

## 📊 Monitoring

### Vercel Dashboard

- **Analytics**: Traffic, performance metrics
- **Logs**: Real-time application logs
- **Speed Insights**: Performance monitoring

### Access Logs

```bash
vercel logs YOUR_PROJECT_URL
```

---

## 🔄 Update/Redeploy

### Automatic (GitHub connected)

```bash
# Code change করুন
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically deploy করবে! ✨

### Manual (CLI)

```bash
vercel --prod
```

---

## 🎯 Custom Domain

### Add Custom Domain

1. Vercel Dashboard → Settings → Domains
2. **"Add"** ক্লিক করুন
3. আপনার domain enter করুন
4. DNS records add করুন (Vercel instructions follow করুন)

---

## 💰 Vercel Free Tier

- ✅ **100 GB bandwidth/month**
- ✅ **100 deployments/day**
- ✅ **Unlimited projects**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **No sleep mode** (always active!)

---

## ✅ Deployment Checklist

- [ ] Python project তৈরি (`python-blog` folder)
- [ ] GitHub repository create এবং push
- [ ] Vercel account তৈরি
- [ ] Vercel এ project import
- [ ] Environment variables add
- [ ] Deploy করুন
- [ ] Website test করুন
- [ ] API docs verify করুন
- [ ] Database connection test করুন
- [ ] AI generation test করুন

---

## 🎉 Success!

আপনার Blog Website এখন live:

🌐 **Website**: `https://your-project.vercel.app`
📚 **API Docs**: `https://your-project.vercel.app/docs`
🚀 **Status**: Always Active (No Sleep Mode!)

---

**Happy Blogging on Vercel! 🎊**
