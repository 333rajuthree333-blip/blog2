// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Footer text translations
const footerTexts = {
    en: "&copy; 2025 All rights reserved: Technology and Science Edition",
    bn: "&copy; ২০২৫ সর্বস্বত্ব সংরক্ষিত: প্রযুক্তি ও বিজ্ঞান সংস্করণ",
    hi: "&copy; २०२५ सर्वाधिकार सुरक्षित: प्रौद्योगिकी और विज्ञान संस्करण"
};

// Footer links translations
const footerLinks = {
    en: [
        {slug: 'about', title: 'About Us'},
        {slug: 'advertisement', title: 'Advertisement'},
        {slug: 'circulation', title: 'Circulation'},
        {slug: 'terms', title: 'Terms and Conditions'},
        {slug: 'contact', title: 'Contact'},
        {slug: 'newsletter', title: 'Newsletter'},
        {slug: 'report', title: 'Report'}
    ],
    bn: [
        {slug: 'about', title: 'আমাদের সম্পর্কে'},
        {slug: 'advertisement', title: 'বিজ্ঞাপন'},
        {slug: 'circulation', title: 'সার্কুলেশন'},
        {slug: 'terms', title: 'নীতি ও শর্ত'},
        {slug: 'contact', title: 'যোগাযোগ'},
        {slug: 'newsletter', title: 'নিউজলেটার'},
        {slug: 'report', title: 'রিপোর্ট করুন'}
    ],
    hi: [
        {slug: 'about', title: 'हमारे बारे में'},
        {slug: 'advertisement', title: 'विज्ञापन'},
        {slug: 'circulation', title: 'परिसंचरण'},
        {slug: 'terms', title: 'नीति और शर्तें'},
        {slug: 'contact', title: 'संपर्क'},
        {slug: 'newsletter', title: 'समाचार पत्रिका'},
        {slug: 'report', title: 'रिपोर्ट करें'}
    ]
};

// Update footer text based on language
function updateFooterText() {
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
        footerBottom.innerHTML = footerTexts[selectedLanguage] || footerTexts['en'];
    }
}

// Current state
let currentPage = 0;
let currentGeneratedPost = null;
let selectedLanguage = 'en';

// Push Notification System
let notificationPermission = 'default';
let notificationEnabled = false;
let lastPostCheck = 0;

// Initialize notifications on page load
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

    // Load selected language
    selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    document.getElementById('language-select').value = selectedLanguage;
    updateFooterText();
    loadHomePosts();
    loadFooterPages();
    setupEventListeners();

    // Initialize notifications
    initializeNotifications();
});

// Notification System Functions
function initializeNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    // Load saved notification preferences
    notificationEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    notificationPermission = Notification.permission;

    // Request permission if not asked before
    if (notificationPermission === 'default' && notificationEnabled) {
        requestNotificationPermission();
    }

    // Start checking for new posts if enabled
    if (notificationEnabled && notificationPermission === 'granted') {
        startPostChecking();
    }

    // Update UI based on current state
    updateNotificationUI();
}

function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        notificationPermission = permission;
        if (permission === 'granted') {
            notificationEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            startPostChecking();
            showToast('Notifications enabled! You\'ll be notified of new posts.', 'success');
        } else {
            notificationEnabled = false;
            localStorage.setItem('notificationsEnabled', 'false');
            showToast('Notifications disabled.', 'info');
        }
        updateNotificationUI();
    });
}

function toggleNotifications() {
    if (notificationPermission === 'default') {
        requestNotificationPermission();
    } else if (notificationPermission === 'denied') {
        showToast('Notifications are blocked. Please enable them in your browser settings.', 'warning');
    } else {
        notificationEnabled = !notificationEnabled;
        localStorage.setItem('notificationsEnabled', notificationEnabled.toString());

        if (notificationEnabled) {
            startPostChecking();
            showToast('Notifications enabled!', 'success');
        } else {
            stopPostChecking();
            showToast('Notifications disabled.', 'info');
        }

        updateNotificationUI();
    }
}

function updateNotificationUI() {
    // This function can be used to update notification toggle buttons
    // For now, we'll add a notification toggle to the nav
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        // Remove existing notification button if present
        const existingBtn = document.getElementById('notification-toggle');
        if (existingBtn) {
            existingBtn.remove();
        }

        // Add notification toggle button
        const notificationBtn = document.createElement('button');
        notificationBtn.id = 'notification-toggle';
        notificationBtn.className = 'btn btn-outline';
        notificationBtn.onclick = toggleNotifications;
        notificationBtn.title = 'Toggle post notifications';

        const icon = document.createElement('i');
        if (notificationPermission === 'granted' && notificationEnabled) {
            icon.className = 'fas fa-bell';
            notificationBtn.classList.add('active');
        } else if (notificationPermission === 'denied') {
            icon.className = 'fas fa-bell-slash';
        } else {
            icon.className = 'fas fa-bell';
        }

        notificationBtn.appendChild(icon);
        navActions.insertBefore(notificationBtn, navActions.firstChild);
    }
}

let postCheckInterval;

function startPostChecking() {
    if (postCheckInterval) {
        clearInterval(postCheckInterval);
    }

    // Check for new posts every 5 minutes
    postCheckInterval = setInterval(checkForNewPosts, 5 * 60 * 1000);

    // Also check immediately
    setTimeout(checkForNewPosts, 10000); // Check after 10 seconds for demo
}

function stopPostChecking() {
    if (postCheckInterval) {
        clearInterval(postCheckInterval);
        postCheckInterval = null;
    }
}

async function checkForNewPosts() {
    if (!notificationEnabled || notificationPermission !== 'granted') {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts?page=0&size=5`);
        const result = await response.json();

        if (result.success && result.data.content.length > 0) {
            const latestPost = result.data.content[0];
            const postTimestamp = new Date(latestPost.createdAt).getTime();

            // Check if this is a new post (within last 24 hours and newer than last check)
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            if (postTimestamp > oneDayAgo && postTimestamp > lastPostCheck) {
                showNewPostNotification(latestPost);
                lastPostCheck = postTimestamp;
                localStorage.setItem('lastPostCheck', lastPostCheck.toString());
            }
        }
    } catch (error) {
        console.error('Error checking for new posts:', error);
    }
}

function showNewPostNotification(post) {
    const options = {
        body: post.excerpt || 'Check out this new post!',
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'new-post',
        requireInteraction: false,
        silent: false,
        data: {
            url: `/post-detail.html?id=${post.id}`,
            postId: post.id
        }
    };

    const notification = new Notification(`📰 New Post: ${post.title}`, options);

    // Handle click on notification
    notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        window.location.href = options.data.url;
        notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
        notification.close();
    }, 10000);
}

// Load last post check timestamp
const savedLastCheck = localStorage.getItem('lastPostCheck');
if (savedLastCheck) {
    lastPostCheck = parseInt(savedLastCheck);
}

// Test notification function (for demo)
function testNotification() {
    if (notificationPermission !== 'granted') {
        showToast('Please enable notifications first!', 'warning');
        return;
    }

    // Create a fake post for testing
    const testPost = {
        id: 999,
        title: '🚀 Welcome to Our Blog - Test Notification!',
        excerpt: 'This is a test notification to demonstrate our push notification system.',
        createdAt: new Date().toISOString(),
        author: 'Admin',
        tags: ['test', 'notification', 'demo']
    };

    showNewPostNotification(testPost);
    showToast('Test notification sent!', 'success');
}

// Make test function available globally for easy testing
window.testNotification = testNotification;

// Bookmark/Save for Later System
class BookmarkManager {
    constructor() {
        this.storageKey = 'techsci_bookmarks';
        this.bookmarks = this.loadBookmarks();
        this.init();
    }

    init() {
        this.addBookmarkButtons();
        this.updateBookmarkUI();
    }

    loadBookmarks() {
        try {
            const bookmarks = localStorage.getItem(this.storageKey);
            return bookmarks ? JSON.parse(bookmarks) : {};
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            return {};
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    }

    isBookmarked(postId) {
        return !!this.bookmarks[postId];
    }

    addBookmark(postId, postData) {
        this.bookmarks[postId] = {
            ...postData,
            bookmarkedAt: new Date().toISOString()
        };
        this.saveBookmarks();
        this.updateBookmarkUI();
        this.updateNavCount();
        this.showBookmarkToast('Post saved for later!', 'success');
    }

    removeBookmark(postId) {
        if (this.bookmarks[postId]) {
            delete this.bookmarks[postId];
            this.saveBookmarks();
            this.updateBookmarkUI();
            this.updateNavCount();
            this.showBookmarkToast('Post removed from saved list', 'info');
        }
    }

    updateNavCount() {
        const countElement = document.getElementById('bookmark-count');
        if (countElement) {
            const count = this.getAllBookmarks().length;
            countElement.textContent = count > 0 ? count : '';
        }
    }

    toggleBookmark(postId, postData) {
        if (this.isBookmarked(postId)) {
            this.removeBookmark(postId);
        } else {
            this.addBookmark(postId, postData);
        }
    }

    getAllBookmarks() {
        return Object.values(this.bookmarks).sort((a, b) =>
            new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)
        );
    }

    addBookmarkButtons() {
        // Add bookmark buttons to post cards
        const postCards = document.querySelectorAll('.post-card');
        postCards.forEach(card => {
            const postId = card.onclick?.toString().match(/viewPost\((\d+)\)/)?.[1];
            if (postId) {
                this.addBookmarkButtonToCard(card, parseInt(postId));
            }
        });

        // Add bookmark button to post detail page
        const postDetail = document.querySelector('.post-detail');
        if (postDetail) {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            if (postId) {
                this.addBookmarkButtonToDetail(postDetail, parseInt(postId));
            }
        }
    }

    addBookmarkButtonToCard(card, postId) {
        // Check if button already exists
        if (card.querySelector('.bookmark-btn')) return;

        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'bookmark-btn';
        bookmarkBtn.onclick = (e) => {
            e.stopPropagation();
            this.handleBookmarkClick(postId, card);
        };

        const icon = document.createElement('i');
        icon.className = this.isBookmarked(postId) ? 'fas fa-bookmark' : 'far fa-bookmark';
        bookmarkBtn.appendChild(icon);

        // Add to card
        card.style.position = 'relative';
        bookmarkBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid var(--border);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
        `;

        bookmarkBtn.onmouseenter = () => {
            bookmarkBtn.style.transform = 'scale(1.1)';
            bookmarkBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };

        bookmarkBtn.onmouseleave = () => {
            bookmarkBtn.style.transform = 'scale(1)';
            bookmarkBtn.style.boxShadow = 'none';
        };

        card.appendChild(bookmarkBtn);
    }

    addBookmarkButtonToDetail(container, postId) {
        // Check if button already exists
        if (container.querySelector('.bookmark-btn-detail')) return;

        const header = container.querySelector('.post-header');
        if (!header) return;

        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'bookmark-btn-detail btn btn-outline';
        bookmarkBtn.onclick = () => this.handleBookmarkClick(postId, container);

        const icon = document.createElement('i');
        icon.className = this.isBookmarked(postId) ? 'fas fa-bookmark' : 'far fa-bookmark';
        bookmarkBtn.appendChild(icon);

        const text = document.createElement('span');
        text.textContent = this.isBookmarked(postId) ? ' Saved' : ' Save for Later';
        bookmarkBtn.appendChild(text);

        // Add to header actions
        let actionsContainer = header.querySelector('.post-actions');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'post-actions';
            actionsContainer.style.cssText = `
                display: flex;
                gap: 10px;
                align-items: center;
                margin-top: 15px;
            `;
            header.appendChild(actionsContainer);
        }

        actionsContainer.appendChild(bookmarkBtn);
    }

    handleBookmarkClick(postId, element) {
        // Extract post data from the element
        const title = element.querySelector('.post-card-title, .post-title')?.textContent || 'Untitled Post';
        const excerpt = element.querySelector('.post-card-excerpt')?.textContent || '';
        const author = element.querySelector('.post-card-meta span:first-child')?.textContent?.replace('👤 ', '') || 'Anonymous';

        const postData = {
            id: postId,
            title: title,
            excerpt: excerpt,
            author: author,
            url: `/post-detail.html?id=${postId}`
        };

        this.toggleBookmark(postId, postData);
    }

    updateBookmarkUI() {
        // Update all bookmark buttons
        document.querySelectorAll('.bookmark-btn, .bookmark-btn-detail').forEach(btn => {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');

            // Get post ID from various sources
            let postId = null;
            const card = btn.closest('.post-card');
            if (card) {
                const onclick = card.onclick?.toString();
                postId = onclick?.match(/viewPost\((\d+)\)/)?.[1];
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                postId = urlParams.get('id');
            }

            if (postId && icon) {
                const isBookmarked = this.isBookmarked(parseInt(postId));
                icon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';

                if (text) {
                    text.textContent = isBookmarked ? ' Saved' : ' Save for Later';
                }

                if (isBookmarked) {
                    btn.classList.add('bookmarked');
                } else {
                    btn.classList.remove('bookmarked');
                }
            }
        });
    }

    showBookmarkToast(message, type = 'success') {
        // Use existing toast system if available
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            // Fallback simple alert
            alert(message);
        }
    }

    // Get bookmark statistics
    getStats() {
        const bookmarks = this.getAllBookmarks();
        return {
            totalBookmarks: bookmarks.length,
            recentBookmarks: bookmarks.slice(0, 5)
        };
    }
}

// Initialize bookmark system
const bookmarkManager = new BookmarkManager();

// Update nav count on page load
document.addEventListener('DOMContentLoaded', function() {
    bookmarkManager.updateNavCount();
});

// Make bookmark manager globally available for debugging
window.bookmarkManager = bookmarkManager;

// Lazy Loading Implementation
class LazyLoader {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        // Check if Intersection Observer is supported
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadElement(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            this.observeElements();
        } else {
            // Fallback for older browsers
            this.loadAllElements();
        }
    }

    observeElements() {
        // Lazy load images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.observer.observe(img);
        });

        // Lazy load content blocks
        const lazyContent = document.querySelectorAll('.lazy-content');
        lazyContent.forEach(content => {
            this.observer.observe(content);
        });

        // Lazy load iframes
        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        lazyIframes.forEach(iframe => {
            this.observer.observe(iframe);
        });
    }

    loadElement(element) {
        if (element.tagName === 'IMG' && element.dataset.src) {
            // Load lazy image
            element.src = element.dataset.src;
            element.classList.remove('lazy');
            element.classList.add('loaded');

            // Add error handling
            element.addEventListener('error', () => {
                element.src = '/images/placeholder.jpg'; // Fallback image
            });

            // Add load event for animations
            element.addEventListener('load', () => {
                element.style.opacity = '1';
            });

        } else if (element.classList.contains('lazy-content')) {
            // Load lazy content
            element.style.opacity = '1';
            element.classList.add('loaded');

        } else if (element.tagName === 'IFRAME' && element.dataset.src) {
            // Load lazy iframe
            element.src = element.dataset.src;
            element.classList.add('loaded');
        }
    }

    loadAllElements() {
        // Fallback for browsers without Intersection Observer
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });

        const lazyContent = document.querySelectorAll('.lazy-content');
        lazyContent.forEach(content => {
            content.style.opacity = '1';
        });
    }
}

// Image Compression and Optimization
class ImageOptimizer {
    constructor() {
        this.supportedFormats = this.checkWebP();
        this.init();
    }

    checkWebP() {
        // Check if browser supports WebP
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > -1;
    }

    init() {
        this.optimizeImages();
        this.addResponsiveImages();
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add loading attribute for native lazy loading (fallback)
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Add alt text if missing
            if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', 'Blog image');
            }

            // Add decoding hint
            img.setAttribute('decoding', 'async');

            // Add fetch priority for above-the-fold images
            if (this.isAboveFold(img)) {
                img.setAttribute('fetchpriority', 'high');
            }
        });
    }

    isAboveFold(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.left < window.innerWidth;
    }

    addResponsiveImages() {
        // Add responsive image support with srcset
        const images = document.querySelectorAll('img[data-responsive]');
        images.forEach(img => {
            if (img.dataset.srcset) {
                img.setAttribute('srcset', img.dataset.srcset);
                img.setAttribute('sizes', img.dataset.sizes || '(max-width: 768px) 100vw, 50vw');
            }
        });
    }

    // Generate optimized image URLs
    static getOptimizedImageUrl(originalUrl, options = {}) {
        const { width, height, quality = 80, format = 'auto' } = options;

        // This would integrate with an image CDN like Cloudinary, Imgix, etc.
        // For now, return the original URL with optimization hints
        return originalUrl + `?w=${width || 'auto'}&h=${height || 'auto'}&q=${quality}&f=${format}`;
    }
}

// Browser Caching and Performance Optimization
class CacheManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupServiceWorker();
        this.addCacheHeaders();
        this.optimizeAssets();
    }

    setupServiceWorker() {
        // Register service worker for caching
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered: ', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    }

    addCacheHeaders() {
        // Add cache-busting for dynamic content
        const timestamp = Date.now();
        const dynamicElements = document.querySelectorAll('[data-cache-bust]');

        dynamicElements.forEach(element => {
            const src = element.src || element.href;
            if (src) {
                const separator = src.includes('?') ? '&' : '?';
                element.src = src + separator + '_t=' + timestamp;
            }
        });
    }

    optimizeAssets() {
        // Preload critical resources
        this.preloadCriticalAssets();

        // Defer non-critical JavaScript
        this.deferNonCriticalJS();

        // Optimize font loading
        this.optimizeFonts();
    }

    preloadCriticalAssets() {
        // Preload critical CSS and fonts
        const criticalAssets = [
            { href: '/css/style.css', as: 'style' },
            { href: '/css/chatbot.css', as: 'style' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' }
        ];

        criticalAssets.forEach(asset => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = asset.href;
            link.as = asset.as;
            if (asset.crossorigin) link.crossOrigin = asset.crossorigin;
            document.head.appendChild(link);
        });
    }

    deferNonCriticalJS() {
        // Move non-critical scripts to end of body
        const scripts = document.querySelectorAll('script[data-defer]');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            newScript.defer = true;
            document.body.appendChild(newScript);
            script.remove();
        });
    }

    optimizeFonts() {
        // Add font-display: swap for better loading
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            link.href += '&display=swap';
        });

        // Preload critical fonts
        const fontPreload = document.createElement('link');
        fontPreload.rel = 'preload';
        fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
        fontPreload.as = 'font';
        fontPreload.type = 'font/woff2';
        fontPreload.crossOrigin = 'anonymous';
        document.head.appendChild(fontPreload);
    }
}

// Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        this.monitorCoreWebVitals();
        this.trackPageLoadTime();
        this.monitorResourceLoading();
    }

    monitorCoreWebVitals() {
        // Monitor Core Web Vitals
        if ('web-vitals' in window) {
            import('https://unpkg.com/web-vitals@3.1.0/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(console.log);
                getFID(console.log);
                getFCP(console.log);
                getLCP(console.log);
                getTTFB(console.log);
            });
        }
    }

    trackPageLoadTime() {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`Page load time: ${loadTime}ms`);

            // Send to analytics (if available)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    event_category: 'performance',
                    event_label: 'page_load',
                    value: Math.round(loadTime)
                });
            }
        });
    }

    monitorResourceLoading() {
        // Monitor large resources
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 1000) { // Resources taking > 1s
                    console.warn(`Slow resource: ${entry.name} (${entry.duration}ms)`);
                }
            }
        });

        observer.observe({ entryTypes: ['resource'] });
    }
}

// Initialize all optimization features
document.addEventListener('DOMContentLoaded', () => {
    // Initialize performance optimizations
    new LazyLoader();
    new ImageOptimizer();
    new CacheManager();
    new PerformanceMonitor();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopPostChecking();
});

// ... (rest of the code remains the same)

const createPostForm = document.getElementById('create-post-form');
if (createPostForm) {
    createPostForm.addEventListener('submit', handleCreatePost);
    }
}

// Change language
function changeLanguage(lang) {
    selectedLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateFooterText();
    loadFooterPages();
    // Reload posts if on home or posts section
    const homeElement = document.getElementById('home');
    const postsElement = document.getElementById('posts');

    if (homeElement && homeElement.style.display !== 'none') {
        loadHomePosts();
    } else if (postsElement && postsElement.style.display !== 'none') {
        loadPosts();
    }
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.section, .hero').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    if (sectionId === 'posts') {
        loadPosts();
    }
}

// Load home posts and sidebar content
async function loadHomePosts() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/posts?page=0&size=12&lang=${selectedLanguage}`);
        const result = await response.json();
        if (result.success) {
            displayHomePosts(result.data.content);
            // Load sidebar content
            loadTrendingPosts();
            loadPopularPosts();
            loadPoll(); // Load interactive poll
        }
    } catch (error) {
        console.error('Error loading home posts:', error);
    } finally {
        showLoading(false);
    }
}

// Load trending posts for sidebar
async function loadTrendingPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/weekly-popular?limit=5`);
        const result = await response.json();
        if (result.success) {
            displayTrendingPosts(result.data);
        }
    } catch (error) {
        console.error('Error loading trending posts:', error);
    }
}

// Load trending posts for sidebar
async function loadTrendingPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/weekly-popular?limit=5`);
        const result = await response.json();
        if (result.success) {
            displayTrendingPosts(result.data);
        }
    } catch (error) {
        console.error('Error loading trending posts:', error);
    }
}

// Load popular posts for sidebar
async function loadPopularPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/popular?limit=5`);
        const result = await response.json();
        if (result.success) {
            displayPopularPosts(result.data);
        }
    } catch (error) {
        console.error('Error loading popular posts:', error);
    }
}

// Load interactive poll for sidebar
async function loadPoll() {
    const container = document.getElementById('poll-container');
    if (!container) return;

    try {
        container.innerHTML = '<div class="poll-loading"><i class="fas fa-spinner fa-spin"></i><p>Loading poll...</p></div>';

        const response = await fetch(`${API_BASE_URL}/polls`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Display the first active poll
            const poll = result.data[0];
            displayPoll(poll);
        } else {
            container.innerHTML = '<div class="poll-loading"><i class="fas fa-poll"></i><p>No active polls</p></div>';
        }
    } catch (error) {
        console.error('Error loading poll:', error);
        container.innerHTML = '<div class="poll-error">Failed to load poll</div>';
    }
}

// Display poll in the sidebar
function displayPoll(pollData) {
    const container = document.getElementById('poll-container');
    if (!container) return;

    // Check if poll is expired
    if (pollData.hasExpired || !pollData.isAvailable) {
        container.innerHTML = `
            <div class="poll-expired">
                <i class="fas fa-clock"></i>
                <p>Poll has ended</p>
            </div>
        `;
        return;
    }

    // Generate voter identifier
    const voterId = generateVoterId();

    let pollHtml = `
        <div class="poll-question">${pollData.question}</div>
    `;

    if (pollData.description) {
        pollHtml += `<div class="poll-description">${pollData.description}</div>`;
    }

    // Check if user has voted
    if (pollData.userHasVoted) {
        // Show results
        pollHtml += '<div class="poll-results">';
        pollData.options.forEach(option => {
            const isSelected = pollData.userSelectedOptionId === option.id;
            pollHtml += `
                <div class="poll-result-item ${isSelected ? 'selected' : ''}">
                    <div class="poll-result-info">
                        <span class="poll-result-text">${option.optionText}</span>
                        <span class="poll-result-percentage">${option.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="poll-result-bar-container">
                        <div class="poll-result-bar" style="width: ${option.percentage}%"></div>
                    </div>
                    <div class="poll-result-votes">${option.voteCount} votes</div>
                </div>
            `;
        });
        pollHtml += '</div>';
    } else {
        // Show voting options
        pollHtml += '<div class="poll-options">';
        pollData.options.forEach(option => {
            pollHtml += `
                <div class="poll-option" data-option-id="${option.id}" onclick="selectPollOption(${option.id})">
                    <span class="poll-option-text">${option.optionText}</span>
                </div>
            `;
        });
        pollHtml += '</div>';
        pollHtml += `<button class="poll-vote-btn" id="vote-btn" onclick="submitPollVote(${pollData.id})" disabled>Vote</button>`;
    }

    // Poll metadata
    pollHtml += `
        <div class="poll-meta">
            <span><i class="fas fa-users"></i> ${pollData.totalVotes} votes</span>
            <span><i class="fas fa-clock"></i> ${formatTimeAgo(pollData.createdAt)}</span>
        </div>
    `;

    container.innerHTML = pollHtml;
}

// Generate unique voter identifier
function generateVoterId() {
    // Use IP + User Agent hash for anonymous voting
    const ip = 'anonymous'; // Would be obtained from server in real implementation
    const userAgent = navigator.userAgent;
    return btoa(ip + userAgent).substring(0, 16);
}

// Handle option selection
let selectedOptionId = null;

function selectPollOption(optionId) {
    selectedOptionId = optionId;

    // Update UI to show selection
    document.querySelectorAll('.poll-option').forEach(option => {
        option.classList.remove('selected');
    });

    document.querySelector(`[data-option-id="${optionId}"]`).classList.add('selected');

    // Enable vote button
    document.getElementById('vote-btn').disabled = false;
}

// Submit poll vote
async function submitPollVote(pollId) {
    if (!selectedOptionId) {
        showToast('Please select an option', 'warning');
        return;
    }

    const voteBtn = document.getElementById('vote-btn');
    const originalText = voteBtn.innerHTML;
    voteBtn.disabled = true;
    voteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Voting...';

    try {
        const response = await fetch(`${API_BASE_URL}/polls/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                optionId: selectedOptionId,
                voterIdentifier: generateVoterId()
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Vote submitted successfully!', 'success');
            // Reload the poll to show results
            loadPoll();
        } else {
            throw new Error(result.message || 'Vote submission failed');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showToast('Failed to submit vote. Please try again.', 'error');
        voteBtn.disabled = false;
        voteBtn.innerHTML = originalText;
    }
}

// Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Display trending posts in sidebar
function displayTrendingPosts(posts) {
    const container = document.getElementById('trending-posts');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); font-size: 0.9rem;">No trending posts yet</p>';
        return;
    }

    container.innerHTML = posts.map((post, index) => `
        <div class="trending-item" onclick="viewPost(${post.id})">
            <div class="trending-number">${index + 1}</div>
            <div class="trending-content">
                <div class="trending-title">${post.title}</div>
                <div class="trending-meta">
                    <span><i class="fas fa-eye"></i> ${post.viewCount || 0}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display popular posts in sidebar
function displayPopularPosts(posts) {
    const container = document.getElementById('popular-posts');
    if (!container) return;

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); font-size: 0.9rem;">No popular posts yet</p>';
        return;
    }

    container.innerHTML = posts.map((post, index) => `
        <div class="popular-item" onclick="viewPost(${post.id})">
            <div class="popular-number">${index + 1}</div>
            <div class="popular-content">
                <div class="popular-title">${post.title}</div>
                <div class="popular-meta">
                    <span><i class="fas fa-eye"></i> ${post.viewCount || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Newsletter subscription (with API call)
async function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();

    if (!email) {
        showToast('Please enter your email address', 'warning');
        return;
    }

    if (!email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    const subscribeBtn = document.querySelector('.newsletter-signup button');
    const originalText = subscribeBtn.innerHTML;
    subscribeBtn.disabled = true;
    subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

    try {
        const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                name: null // Optional name field
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('🎉 Successfully subscribed! Check your email to confirm.', 'success');
            emailInput.value = ''; // Clear the input
        } else {
            throw new Error(result.message || 'Subscription failed');
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        showToast('Failed to subscribe. Please try again.', 'error');
    } finally {
        // Reset button
        subscribeBtn.disabled = false;
        subscribeBtn.innerHTML = originalText;
    }
}

function displayHomePosts(posts) {
    const container = document.getElementById('home-posts');
    if (!container) return; // Element doesn't exist on this page
    
    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No posts available yet.</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card" onclick="viewPost(${post.id})">
            ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="post-card-image" loading="lazy" decoding="async">` : ''}
            <div class="post-card-content">
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-excerpt">${post.excerpt || ''}</p>
                <div class="post-card-meta">
                    <span><i class="fas fa-user"></i> ${post.author || 'Anonymous'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
                    <span><i class="fas fa-eye"></i> ${post.viewCount} views</span>
                </div>
                ${post.isAiGenerated ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI</span>' : ''}
            </div>
        </div>
    `).join('');
}

// Load footer pages
async function loadFooterPages() {
    try {
        const response = await fetch(`${API_BASE_URL}/pages/footer?lang=${selectedLanguage}`);
        const result = await response.json();
        if (result.success) {
            const container = document.getElementById('footer-pages');
            if (!container) return; // Element doesn't exist on this page
            
            const linksHtml = result.data.map(page => {
                const pageFile = `${page.slug}.html`;
                return `<a href="${pageFile}">${page.title}</a>`;
            }).join(' ');
            container.innerHTML = linksHtml;
        }
    } catch (error) {
        console.error('Error loading footer pages:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/stats`);
        const result = await response.json();
        if (result.success) {
            const totalPostsElement = document.getElementById('total-posts');
            if (totalPostsElement) {
                totalPostsElement.textContent = result.data.totalPublishedPosts;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load posts
async function loadPosts(page = 0) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/posts?page=${page}&size=9&lang=${selectedLanguage}`);
        const result = await response.json();
        if (result.success) {
            displayPosts(result.data.content);
            displayPagination(result.data);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        showToast('Error loading posts', 'error');
    } finally {
        showLoading(false);
    }
}

// Display posts
function displayPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return; // Element doesn't exist on this page
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="text-center">No posts found.</p>';
        return;
    }
    container.innerHTML = posts.map(post => `
        <div class="post-card" onclick="viewPost(${post.id})">
            <div class="post-image">
                ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title} - Featured image for ${post.title}" loading="lazy" decoding="async" fetchpriority="low">` : ''}
            </div>
            <div class="post-card-content">
                <div class="post-card-meta">
                    <span><i class="fas fa-user"></i> ${post.author || 'Anonymous'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
                    ${post.isAiGenerated ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI</span>' : ''}
                </div>
                <h3 class="post-card-title">${post.title}</h3>
                <p class="post-card-excerpt">${post.excerpt || ''}</p>
                <div class="post-card-tags">
                    ${(post.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Display pagination
function displayPagination(pageData) {
    const container = document.getElementById('pagination');
    if (!container) return; // Element doesn't exist on this page
    
    const { number, totalPages } = pageData;
    let html = '';
    html += `<button onclick="loadPosts(${number - 1})" ${number === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Previous</button>`;
    for (let i = 0; i < totalPages && i < 5; i++) {
        html += `<button class="${i === number ? 'active' : ''}" onclick="loadPosts(${i})">${i + 1}</button>`;
    }
    html += `<button onclick="loadPosts(${number + 1})" ${number >= totalPages - 1 ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

// Show post detail
async function showPost(postId) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`);
        const result = await response.json();
        if (result.success) {
            const post = result.data;
            const postUrl = encodeURIComponent(window.location.origin + '/post/' + post.id);
            const postTitle = encodeURIComponent(post.title);
            
            const postDetailElement = document.getElementById('post-detail');
            const postModalElement = document.getElementById('post-modal');
            
            if (postDetailElement) {
                postDetailElement.innerHTML = `
                    <h1>${post.title}</h1>
                    <div class="post-card-meta" style="margin: 1rem 0;">
                        <span><i class="fas fa-user"></i> ${post.author || 'Anonymous'}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(post.createdAt)}</span>
                        <span><i class="fas fa-eye"></i> ${post.viewCount} views</span>
                        ${post.isAiGenerated ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI Generated</span>' : ''}
                    </div>
                    <div class="social-share">
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${postUrl}" target="_blank" class="social-share-btn facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=${postTitle}&url=${postUrl}" target="_blank" class="social-share-btn twitter">
                            <i class="fab fa-x-twitter"></i>
                        </a>
                        <a href="javascript:void(0)" onclick="sharePost('${post.title}', '${window.location.origin}/post/${post.id}')" class="social-share-btn share">
                            <i class="fas fa-share-alt"></i>
                        </a>
                        <a href="https://wa.me/?text=${postTitle}%20${postUrl}" target="_blank" class="social-share-btn whatsapp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="javascript:window.print()" class="social-share-btn print">
                            <i class="fas fa-print"></i>
                        </a>
                    </div>
                    ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" style="width: 100%; border-radius: 0.5rem; margin: 1rem 0;">` : ''}
                    <div style="line-height: 1.8; white-space: pre-wrap;">${post.content}</div>
                    <div class="post-card-tags" style="margin-top: 2rem;">
                        ${(post.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;
            }
            
            if (postModalElement) {
                postModalElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading post:', error);
        showToast('Error loading post', 'error');
    } finally {
        showLoading(false);
    }
}

async function sharePost(title, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                url: url
            });
        } catch (error) {
            console.log('Share cancelled');
        }
    } else {
        navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!', 'success');
    }
}

function closeModal() {
    document.getElementById('post-modal').style.display = 'none';
}

// View post detail page
function viewPost(postId) {
    window.location.href = `post-detail.html?id=${postId}&lang=${selectedLanguage}`;
}

// Handle create post
async function handleCreatePost(e) {
    e.preventDefault();
    showLoading(true);
    try {
        let featuredImage = null;
        const imageFile = document.getElementById('post-image').files[0];
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            const uploadRes = await fetch(`${API_BASE_URL}/upload/image`, {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadRes.json();
            if (uploadResult.success) {
                featuredImage = uploadResult.data.fileUrl;
            }
        }
        const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const postData = {
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-content').value,
            excerpt: document.getElementById('post-excerpt').value,
            author: document.getElementById('post-author').value || 'Anonymous',
            tags: tags,
            featuredImage: featuredImage,
            published: document.getElementById('post-published').checked
        };
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        const result = await response.json();
        if (result.success) {
            showToast('Post created successfully!', 'success');
            resetForm();
            loadStats();
        } else {
            showToast(result.message || 'Error creating post', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Error creating post', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle AI generate
async function handleAIGenerate(e) {
    e.preventDefault();
    showLoading(true);
    try {
        const requestData = {
            prompt: document.getElementById('ai-prompt').value,
            author: document.getElementById('ai-author').value || 'AI Assistant'
        };
        const response = await fetch(`${API_BASE_URL}/posts/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        const result = await response.json();
        if (result.success) {
            currentGeneratedPost = result.data;
            displayAIResult(result.data);
            showToast('Blog post generated successfully!', 'success');
        } else {
            showToast(result.message || 'Error generating post', 'error');
        }
    } catch (error) {
        console.error('Error generating post:', error);
        showToast('Error generating post', 'error');
    } finally {
        showLoading(false);
    }
}

function displayAIResult(post) {
    const preview = document.getElementById('ai-post-preview');
    preview.innerHTML = `
        <h2>${post.title}</h2>
        <p><strong>Author:</strong> ${post.author}</p>
        <p><strong>Excerpt:</strong> ${post.excerpt}</p>
        <p><strong>Tags:</strong> ${(post.tags || []).join(', ')}</p>
        <hr style="margin: 1rem 0;">
        <div style="white-space: pre-wrap;">${post.content}</div>
    `;
    document.getElementById('ai-result').style.display = 'block';
}

async function publishAIPost() {
    if (!currentGeneratedPost) return;
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${currentGeneratedPost.id}/publish`, {
            method: 'PATCH'
        });
        const result = await response.json();
        if (result.success) {
            showToast('Post published successfully!', 'success');
            document.getElementById('ai-result').style.display = 'none';
            document.getElementById('ai-generate-form').reset();
            loadStats();
        }
    } catch (error) {
        showToast('Error publishing post', 'error');
    } finally {
        showLoading(false);
    }
}

function editAIPost() {
    if (!currentGeneratedPost) return;
    document.getElementById('post-title').value = currentGeneratedPost.title;
    document.getElementById('post-content').value = currentGeneratedPost.content;
    document.getElementById('post-excerpt').value = currentGeneratedPost.excerpt || '';
    document.getElementById('post-author').value = currentGeneratedPost.author || '';
    document.getElementById('post-tags').value = (currentGeneratedPost.tags || []).join(', ');
    showSection('create');
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function resetForm() {
    document.getElementById('create-post-form').reset();
    document.getElementById('image-preview').innerHTML = '';
}

// Enhanced search function with smart search
async function performSmartSearch(query, page = 0) {
    if (!query || query.trim().length < 2) {
        showToast('Please enter at least 2 characters', 'warning');
        return;
    }

    showLoading(true);

    try {
        // Use smart search endpoint
        const response = await fetch(`${API_BASE_URL}/search/smart?query=${encodeURIComponent(query)}&page=${page}&size=10`);
        const result = await response.json();

        if (result.success) {
            displaySmartSearchResults(result.data);
        } else {
            showToast('Search failed', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        // Fallback to regular search
        performRegularSearch(query, page);
    } finally {
        showLoading(false);
    }
}

// Display smart search results with suggestions
function displaySmartSearchResults(data) {
    const container = document.getElementById('search-results');
    if (!container) return;

    // Switch to search results section
    showSection('search-results-section');

    let html = '';

    // Search summary
    html += `
        <div class="search-summary">
            <h3>Search Results for "${data.query}"</h3>
            <p>Found ${data.totalResults} results</p>
        </div>
    `;

    // Search suggestions
    if (data.suggestions && data.suggestions.length > 0) {
        html += `
            <div class="search-suggestions">
                <h4>🔍 Try also searching for:</h4>
                <div class="suggestion-tags">
                    ${data.suggestions.map(suggestion => `
                        <span class="tag suggestion-tag" onclick="performSmartSearch('${suggestion}')">${suggestion}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Related topics
    if (data.relatedTopics && data.relatedTopics.length > 0) {
        html += `
            <div class="related-topics">
                <h4>📚 Related Topics:</h4>
                <div class="topic-tags">
                    ${data.relatedTopics.map(topic => `
                        <span class="tag topic-tag" onclick="performSmartSearch('${topic}')">${topic}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Search results
    if (data.results && data.results.length > 0) {
        html += '<div class="search-results-list">';
        data.results.forEach(post => {
            html += `
                <div class="search-result-item" onclick="viewPost(${post.id})">
                    <div class="result-header">
                        <h4>${post.title}</h4>
                        <span class="relevance-score">Relevance: ${post.score ? post.score.toFixed(1) : 'N/A'}</span>
                    </div>
                    <p class="result-excerpt">${post.excerpt || ''}</p>
                    <div class="result-meta">
                        <span>👤 ${post.author || 'Anonymous'}</span>
                        <span>📅 ${formatDate(post.createdAt)}</span>
                        <span>👁️ ${post.viewCount || 0} views</span>
                    </div>
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="result-tags">
                            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<div class="no-results"><p>No results found for your search.</p></div>';
    }

    // Search tips
    if (data.searchTips && data.searchTips.length > 0) {
        html += `
            <div class="search-tips">
                <h4>💡 Search Tips:</h4>
                <ul>
                    ${data.searchTips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    container.innerHTML = html;
    container.style.display = 'block';

    // Update pagination if needed
    if (data.totalPages > 1) {
        displaySmartSearchPagination(data);
    }
}

// Display pagination for smart search
function displaySmartSearchPagination(data) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const { currentPage, totalPages, query } = data;
    let html = '';

    html += `<button onclick="performSmartSearch('${query}', ${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Previous</button>`;

    for (let i = Math.max(0, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="performSmartSearch('${query}', ${i})">${i + 1}</button>`;
    }

    html += `<button onclick="performSmartSearch('${query}', ${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

// Fallback regular search
async function performRegularSearch(query, page = 0) {
    try {
        const response = await fetch(`${API_BASE_URL}?page=${page}&size=9&lang=${selectedLanguage}`);
        const result = await response.json();

        if (result.success) {
            // Filter posts that match the query
            const filteredPosts = result.data.content.filter(post =>
                post.title.toLowerCase().includes(query.toLowerCase()) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(query.toLowerCase()))
            );

            displayPosts({ content: filteredPosts, number: page, totalPages: 1 });
        }
    } catch (error) {
        console.error('Regular search error:', error);
        showToast('Search failed', 'error');
    }
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

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }

    // Update chatbot theme as well
    updateChatbotTheme(theme);
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

// Update chatbot theme
function updateChatbotTheme(theme) {
    // Update chatbot container theme
    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
        if (theme === 'dark') {
            chatbotContainer.style.background = '#1a1a1a';
            chatbotContainer.style.border = '1px solid #333';
        } else {
            chatbotContainer.style.background = 'var(--card-bg)';
            chatbotContainer.style.border = '1px solid var(--border)';
        }
    }

    // Update messages area
    const messagesArea = document.getElementById('chatbot-messages');
    if (messagesArea) {
        messagesArea.style.background = theme === 'dark' ? '#2a2a2a' : 'var(--bg)';
    }

    // Update input area
    const inputArea = document.getElementById('chatbot-input-area');
    if (inputArea) {
        inputArea.style.background = theme === 'dark' ? '#1a1a1a' : 'var(--card-bg)';
        inputArea.style.borderTop = theme === 'dark' ? '1px solid #333' : '1px solid var(--border)';
    }

    // Update input field
    const inputField = document.getElementById('chatbot-input');
    if (inputField) {
        inputField.style.background = theme === 'dark' ? '#2a2a2a' : 'var(--bg)';
        inputField.style.border = theme === 'dark' ? '1px solid #555' : '1px solid var(--border)';
        inputField.style.color = theme === 'dark' ? '#ffffff' : 'var(--text)';
    }
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            // Only auto-switch if user hasn't manually set a preference
            const newTheme = e.matches ? 'dark' : 'light';
            currentTheme = newTheme;
            applyTheme(newTheme);
            updateThemeToggleIcon();
        }
    });
}
