// Comments System JavaScript
class CommentsSystem {
    constructor(postId) {
        this.postId = postId;
        this.apiUrl = 'http://localhost:8080/api';
        this.currentPage = 0;
        this.pageSize = 10;
        this.hasMoreComments = true;

        this.init();
    }

    init() {
        this.loadCommentCount();
        this.loadComments();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Comment form submission
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }

        // Character counter for comment textarea
        const commentTextarea = document.getElementById('comment-content');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', () => this.updateCharCount());
        }

        // Load more comments button
        const loadMoreBtn = document.getElementById('load-more-comments');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreComments());
        }
    }

    async loadCommentCount() {
        try {
            const response = await fetch(`${this.apiUrl}/posts/${this.postId}/comments/count`);
            const result = await response.json();

            if (result.success) {
                const countElement = document.getElementById('comment-count');
                if (countElement) {
                    countElement.textContent = `(${result.data})`;
                }
            }
        } catch (error) {
            console.error('Error loading comment count:', error);
        }
    }

    async loadComments() {
        try {
            const response = await fetch(`${this.apiUrl}/posts/${this.postId}/comments`);
            const result = await response.json();

            if (result.success) {
                this.displayComments(result.data);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showError('Failed to load comments');
        }
    }

    displayComments(comments) {
        const container = document.getElementById('comments-list');
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = comments.map(comment => this.createCommentHTML(comment)).join('');

        // Setup upvote buttons
        this.setupUpvoteButtons();
    }

    createCommentHTML(comment) {
        const authorLink = comment.authorWebsite ?
            `<a href="${comment.authorWebsite}" target="_blank" class="comment-author">${comment.authorName}</a>` :
            `<span class="comment-author">${comment.authorName}</span>`;

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div>
                        ${authorLink}
                        <div class="comment-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(comment.createdAt)}</span>
                            ${comment.parentCommentId ? '<span><i class="fas fa-reply"></i> Reply</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                <div class="comment-actions">
                    <button class="upvote-btn" data-comment-id="${comment.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="upvote-count">${comment.upvotes || 0}</span>
                    </button>
                    <button class="btn btn-outline btn-sm reply-btn" data-comment-id="${comment.id}">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                </div>
            </div>
        `;
    }

    setupUpvoteButtons() {
        const upvoteButtons = document.querySelectorAll('.upvote-btn');
        upvoteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const commentId = e.currentTarget.getAttribute('data-comment-id');
                this.upvoteComment(commentId, e.currentTarget);
            });
        });
    }

    async upvoteComment(commentId, buttonElement) {
        // Prevent multiple clicks
        if (buttonElement.disabled) return;
        buttonElement.disabled = true;

        try {
            const response = await fetch(`${this.apiUrl}/posts/comments/${commentId}/upvote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                const newUpvotes = result.data.upvotes || 0;
                const countElement = buttonElement.querySelector('.upvote-count');
                if (countElement) {
                    countElement.textContent = newUpvotes;
                }

                // Add upvoted class for visual feedback
                buttonElement.classList.add('upvoted');

                // Show success message
                this.showToast('Comment upvoted!', 'success');

                // Re-enable button after a short delay
                setTimeout(() => {
                    buttonElement.disabled = false;
                }, 1000);
            } else {
                throw new Error(result.message || 'Failed to upvote comment');
            }
        } catch (error) {
            console.error('Error upvoting comment:', error);
            this.showToast('Failed to upvote comment', 'error');
            buttonElement.disabled = false;
        }
    }

    async handleCommentSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const commentData = {
            authorName: formData.get('authorName').trim(),
            authorEmail: formData.get('authorEmail').trim(),
            content: formData.get('content').trim(),
            authorWebsite: formData.get('authorWebsite').trim() || null,
            postId: this.postId
        };

        // Basic validation
        if (!commentData.authorName || !commentData.authorEmail || !commentData.content) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (commentData.content.length < 10) {
            this.showToast('Comment must be at least 10 characters long', 'error');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submit-comment');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

        try {
            const response = await fetch(`${this.apiUrl}/posts/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });

            const result = await response.json();

            if (result.success) {
                // Clear form
                e.target.reset();
                this.updateCharCount();

                // Reload comments
                await this.loadComments();
                await this.loadCommentCount();

                // Show success message
                this.showToast('Comment posted successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showToast('Failed to post comment. Please try again.', 'error');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    updateCharCount() {
        const textarea = document.getElementById('comment-content');
        const counter = document.getElementById('char-count');

        if (textarea && counter) {
            const length = textarea.value.length;
            counter.textContent = length;

            // Change color based on length
            if (length > 1800) {
                counter.style.color = '#ef4444'; // red
            } else if (length > 1500) {
                counter.style.color = '#f59e0b'; // yellow
            } else {
                counter.style.color = 'var(--text-light)';
            }
        }
    }

    async loadMoreComments() {
        if (!this.hasMoreComments) return;

        this.currentPage++;

        try {
            const response = await fetch(`${this.apiUrl}/posts/${this.postId}/comments?page=${this.currentPage}&size=${this.pageSize}`);
            const result = await response.json();

            if (result.success && result.data.content.length > 0) {
                const container = document.getElementById('comments-list');
                const newCommentsHTML = result.data.content.map(comment => this.createCommentHTML(comment)).join('');
                container.insertAdjacentHTML('beforeend', newCommentsHTML);

                // Setup upvote buttons for new comments
                this.setupUpvoteButtons();

                // Check if there are more comments
                this.hasMoreComments = !result.data.last;
                document.getElementById('load-more-container').style.display = this.hasMoreComments ? 'block' : 'none';
            } else {
                this.hasMoreComments = false;
                document.getElementById('load-more-container').style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading more comments:', error);
            this.showToast('Failed to load more comments', 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        // Use existing toast if available, otherwise create a simple alert
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }
}

// Initialize comments system when DOM is loaded and post ID is available
document.addEventListener('DOMContentLoaded', () => {
    // Get post ID from URL (this is set in post-detail.html)
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        // Initialize comments system
        window.commentsSystem = new CommentsSystem(postId);
    }
});
