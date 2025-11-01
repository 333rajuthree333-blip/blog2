// Theme Management
let currentTheme = 'light';

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(savedTheme);
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
            applyTheme('dark');
        }
    }

    // Update toggle button icon
    updateThemeToggleIcon();

    setupAdminListeners();

    // Initialize notifications
    initializeAdminNotifications();
});

// Theme toggle function
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeToggleIcon();
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Update theme toggle button icon
function updateThemeToggleIcon() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}

// Notification System for Admin
let adminNotificationPermission = 'default';
let adminNotificationEnabled = false;

function initializeAdminNotifications() {
    if (!('Notification' in window)) {
        console.log('Notifications not supported in admin panel');
        return;
    }

    adminNotificationEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    adminNotificationPermission = Notification.permission;

    updateAdminNotificationUI();
}

function toggleAdminNotifications() {
    if (adminNotificationPermission === 'default') {
        Notification.requestPermission().then(permission => {
            adminNotificationPermission = permission;
            if (permission === 'granted') {
                adminNotificationEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                showToast('Notifications enabled!', 'success');
            } else {
                adminNotificationEnabled = false;
                localStorage.setItem('notificationsEnabled', 'false');
                showToast('Notifications disabled.', 'info');
            }
            updateAdminNotificationUI();
        });
    } else if (adminNotificationPermission === 'denied') {
        showToast('Notifications are blocked. Please enable them in your browser settings.', 'warning');
    } else {
        adminNotificationEnabled = !adminNotificationEnabled;
        localStorage.setItem('notificationsEnabled', adminNotificationEnabled.toString());

        if (adminNotificationEnabled) {
            showToast('Notifications enabled!', 'success');
        } else {
            showToast('Notifications disabled.', 'info');
        }

        updateAdminNotificationUI();
    }
}

function updateAdminNotificationUI() {
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const existingBtn = document.getElementById('admin-notification-toggle');
        if (existingBtn) {
            existingBtn.remove();
        }

        const notificationBtn = document.createElement('button');
        notificationBtn.id = 'admin-notification-toggle';
        notificationBtn.className = 'btn btn-outline';
        notificationBtn.onclick = toggleAdminNotifications;
        notificationBtn.title = 'Toggle post notifications';

        const icon = document.createElement('i');
        if (adminNotificationPermission === 'granted' && adminNotificationEnabled) {
            icon.className = 'fas fa-bell';
            notificationBtn.classList.add('active');
        } else if (adminNotificationPermission === 'denied') {
            icon.className = 'fas fa-bell-slash';
        } else {
            icon.className = 'fas fa-bell';
        }

        notificationBtn.appendChild(icon);
        navActions.insertBefore(notificationBtn, navActions.firstChild);
    }
}

function updatePromptValidation() {
    const prompt = document.getElementById('admin-ai-prompt');
    const hint = document.getElementById('prompt-hint');

    if (!prompt || !hint) return;

    const length = prompt.value.trim().length;
    const minLength = 10;
    const maxLength = 500;

    let hintText = `<i class="fas fa-info-circle"></i> Characters: ${length}`;
    let color = 'var(--text-secondary)';

    if (length < minLength) {
        hintText += ` (Need ${minLength - length} more characters)`;
        color = 'var(--danger)';
    } else if (length > maxLength) {
        hintText += ` (Too many characters - max ${maxLength})`;
        color = 'var(--danger)';
    } else {
        hintText += ' ✓ Ready to generate';
        color = 'var(--success)';
    }

    hint.innerHTML = hintText;
    hint.style.color = color;
}

function showManualWrite() {
    document.getElementById('manual-write-section').style.display = 'block';
    document.getElementById('ai-generate-section').style.display = 'none';
}

function showAIGenerate() {
    document.getElementById('manual-write-section').style.display = 'none';
    document.getElementById('ai-generate-section').style.display = 'block';
}

async function handleAdminLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('admin-username').value,
                password: document.getElementById('admin-password').value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            adminToken = result.data.token;
            localStorage.setItem('adminToken', adminToken);
            showAdminDashboard();
            showToast('Login successful!', 'success');
        } else {
            showToast('Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Login failed', 'error');
    } finally {
        showLoading(false);
    }
}

function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        adminToken = token;
        showAdminDashboard();
    }
}

function showAdminDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'flex';
    loadAdminStats();
    loadAdminPosts();
    loadAdminPages();
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    location.reload();
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.admin-menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById(`admin-section-${section}`).style.display = 'block';
    event.target.closest('.admin-menu-item').classList.add('active');
    
    if (section === 'posts') loadAdminPosts();
    if (section === 'pages') loadAdminPages();
}

async function loadAdminStats() {
    try {
        const [postsRes, pagesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/posts/all`),
            fetch(`${API_BASE_URL}/pages`)
        ]);
        
        const postsData = await postsRes.json();
        const pagesData = await pagesRes.json();
        
        if (postsData.success) {
            document.getElementById('admin-total-posts').textContent = postsData.data.totalElements || 0;
            const totalViews = postsData.data.content.reduce((sum, post) => sum + (post.viewCount || 0), 0);
            document.getElementById('admin-total-views').textContent = totalViews;
        }
        
        if (pagesData.success) {
            document.getElementById('admin-total-pages').textContent = pagesData.data.length || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAdminPosts() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/posts/all?size=100`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#admin-posts-table tbody');
            tbody.innerHTML = result.data.content.map(post => `
                <tr>
                    <td>${post.id}</td>
                    <td>${post.title}</td>
                    <td>${post.author || 'N/A'}</td>
                    <td>
                        <span class="tag" style="background: ${post.published ? 'var(--success)' : 'var(--warning)'}; color: white;">
                            ${post.published ? 'Published' : 'Draft'}
                        </span>
                    </td>
                    <td>${post.viewCount || 0}</td>
                    <td>${formatDate(post.createdAt)}</td>
                    <td class="action-btns">
                        <button class="btn btn-sm btn-primary" onclick="togglePublish(${post.id})">
                            <i class="fas fa-${post.published ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn btn-sm" style="background: var(--danger); color: white;" onclick="deletePost(${post.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Error loading posts', 'error');
    } finally {
        showLoading(false);
    }
}

async function togglePublish(postId) {
    if (!confirm('Toggle publish status?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/publish`, {
            method: 'PATCH'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Post updated!', 'success');
            loadAdminPosts();
        }
    } catch (error) {
        showToast('Error updating post', 'error');
    }
}

async function deletePost(postId) {
    if (!confirm('Delete this post permanently?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Post deleted!', 'success');
            loadAdminPosts();
        }
    } catch (error) {
        showToast('Error deleting post', 'error');
    }
}

async function loadAdminPages() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/pages`);
        const result = await response.json();
        
        if (result.success) {
            const tbody = document.querySelector('#admin-pages-table tbody');
            tbody.innerHTML = result.data.map(page => `
                <tr>
                    <td>${page.id}</td>
                    <td>${page.title}</td>
                    <td>${page.slug}</td>
                    <td>
                        <span class="tag" style="background: ${page.published ? 'var(--success)' : 'var(--warning)'}; color: white;">
                            ${page.published ? 'Published' : 'Draft'}
                        </span>
                    </td>
                    <td>
                        <span class="tag">
                            ${page.showInFooter ? 'Yes' : 'No'}
                        </span>
                    </td>
                    <td class="action-btns">
                        <button class="btn btn-sm btn-primary" onclick="editPage(${page.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm" style="background: var(--danger); color: white;" onclick="deletePage(${page.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showToast('Error loading pages', 'error');
    } finally {
        showLoading(false);
    }
}

function showPageForm() {
    document.getElementById('page-form-container').style.display = 'block';
    document.getElementById('page-form').reset();
    document.getElementById('page-id').value = '';
}

function hidePageForm() {
    document.getElementById('page-form-container').style.display = 'none';
}

async function editPage(pageId) {
    try {
        const response = await fetch(`${API_BASE_URL}/pages`);
        const result = await response.json();
        const page = result.data.find(p => p.id === pageId);
        
        if (page) {
            document.getElementById('page-id').value = page.id;
            document.getElementById('page-title').value = page.title;
            document.getElementById('page-slug').value = page.slug;
            document.getElementById('page-content').value = page.content;
            document.getElementById('page-meta').value = page.metaDescription || '';
            document.getElementById('page-published').checked = page.published;
            document.getElementById('page-footer').checked = page.showInFooter;
            showPageForm();
        }
    } catch (error) {
        showToast('Error loading page', 'error');
    }
}

async function handlePageSubmit(e) {
    e.preventDefault();
    showLoading(true);
    
    const pageId = document.getElementById('page-id').value;
    const pageData = {
        title: document.getElementById('page-title').value,
        slug: document.getElementById('page-slug').value,
        content: document.getElementById('page-content').value,
        metaDescription: document.getElementById('page-meta').value,
        published: document.getElementById('page-published').checked,
        showInFooter: document.getElementById('page-footer').checked,
        displayOrder: 0
    };
    
    try {
        const url = pageId ? `${API_BASE_URL}/pages/${pageId}` : `${API_BASE_URL}/pages`;
        const method = pageId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pageData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Page saved!', 'success');
            hidePageForm();
            loadAdminPages();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error saving page', 'error');
    } finally {
        showLoading(false);
    }
}

async function deletePage(pageId) {
    if (!confirm('Delete this page permanently?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Page deleted!', 'success');
            loadAdminPages();
        }
    } catch (error) {
        showToast('Error deleting page', 'error');
    }
}

async function handleAdminAIGenerate(e) {
    e.preventDefault();

    const prompt = document.getElementById('admin-ai-prompt').value.trim();
    const author = document.getElementById('admin-ai-author').value.trim();

    // Client-side validation
    if (!prompt) {
        showToast('Please enter a prompt for AI generation', 'error');
        document.getElementById('admin-ai-prompt').focus();
        return;
    }

    if (prompt.length < 10) {
        showToast('Prompt must be at least 10 characters long', 'error');
        document.getElementById('admin-ai-prompt').focus();
        return;
    }

    if (prompt.length > 500) {
        showToast('Prompt must be less than 500 characters', 'error');
        document.getElementById('admin-ai-prompt').focus();
        return;
    }

    showLoading(true);

    try {
        console.log('Sending AI generate request with prompt:', prompt);
        const response = await fetch(`${API_BASE_URL}/posts/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                author: author || 'Admin'
            })
        });

        console.log('AI generate response status:', response.status);
        const result = await response.json();
        console.log('AI generate response:', result);

        if (result.success) {
            currentAdminPost = result.data;
            document.getElementById('admin-ai-preview').innerHTML = `
                <h2>${result.data.title}</h2>
                <p><strong>Author:</strong> ${result.data.author}</p>
                <p><strong>Excerpt:</strong> ${result.data.excerpt}</p>
                <div style="white-space: pre-wrap; margin-top: 1rem;">${result.data.content}</div>
            `;
            document.getElementById('admin-ai-result').style.display = 'block';
            showToast('Post generated successfully!', 'success');
        } else {
            console.error('AI generation failed:', result);
            showToast(result.message || 'Failed to generate post', 'error');
        }
    } catch (error) {
        console.error('AI generation error:', error);
        showToast('Error generating post. Please check console for details.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleManualCreate(e) {
    e.preventDefault();
    showLoading(true);
    
    try {
        let featuredImage = null;
        const imageFile = document.getElementById('manual-image').files[0];
        
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            const uploadRes = await fetch(`${API_BASE_URL}/upload/image`, {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadRes.json();
            if (uploadResult.success) {
                featuredImage = uploadResult.data;
            }
        }
        
        const tags = document.getElementById('manual-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        const postData = {
            title: document.getElementById('manual-title').value,
            content: document.getElementById('manual-content').value,
            excerpt: document.getElementById('manual-excerpt').value,
            author: document.getElementById('manual-author').value,
            featuredImage: featuredImage,
            tags: tags,
            published: document.getElementById('manual-publish').checked,
            isAiGenerated: false
        };
        
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Post created successfully!', 'success');
            document.getElementById('admin-manual-form').reset();
            document.getElementById('manual-write-section').style.display = 'none';
            loadAdminStats();
            loadAdminPosts();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error creating post', 'error');
    } finally {
        showLoading(false);
    }
}

async function acceptAIPost() {
    if (!currentAdminPost) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${currentAdminPost.id}/publish`, {
            method: 'PATCH'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Post published successfully!', 'success');
            document.getElementById('admin-ai-result').style.display = 'none';
            document.getElementById('admin-ai-form').reset();
            document.getElementById('ai-generate-section').style.display = 'none';
            loadAdminStats();
            loadAdminPosts();
        }
    } catch (error) {
        showToast('Error publishing post', 'error');
    }
}

function regenerateAI() {
    document.getElementById('admin-ai-result').style.display = 'none';
    showToast('Please enter a new prompt to generate again', 'info');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
