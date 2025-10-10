// 岐黄青年说 - 主要JavaScript功能

// 全局变量
let currentCategory = 'all';
let knowledgeData = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeGraph();
    setupEventListeners();
    autoHideFlashMessages();
    initializeAnimations();
});

// 设置事件监听器
function setupEventListeners() {
    // 搜索框回车事件
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('knowledgeModal');
        const searchModal = document.getElementById('searchModal');
        if (e.target === modal) {
            closeModal();
        }
        if (e.target === searchModal) {
            closeSearchModal();
        }
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 搜索功能
async function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        showNotification('请输入搜索关键词', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        
        if (data.results.length === 0) {
            showNotification('没有找到相关内容', 'info');
            return;
        }

        displaySearchResults(data.results);
    } catch (error) {
        console.error('搜索失败:', error);
        showNotification('搜索失败,请稍后重试', 'error');
    }
}

// 显示搜索结果
function displaySearchResults(results) {
    const searchModal = document.getElementById('searchModal');
    const searchResults = document.getElementById('searchResults');
    
    let html = '<div class="search-results-grid">';
    results.forEach(item => {
        html += `
            <div class="search-result-item" onclick="showKnowledgeDetail(${item.id}); closeSearchModal();">
                <div class="result-header">
                    <span class="category-badge">${item.category}</span>
                    <h4>${item.title}</h4>
                </div>
                <p>${item.content}</p>
            </div>
        `;
    });
    html += '</div>';
    
    searchResults.innerHTML = html;
    searchModal.style.display = 'block';
}

// 显示知识详情
async function showKnowledgeDetail(id) {
    try {
        const response = await fetch(`/api/knowledge/${id}`);
        const data = await response.json();
        
        const modal = document.getElementById('knowledgeModal');
        const modalBody = document.getElementById('modalBody');
        
        let commentsHtml = '';
        if (data.comments && data.comments.length > 0) {
            commentsHtml = '<div class="comments-section"><h4>用户评论</h4>';
            data.comments.forEach(comment => {
                commentsHtml += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <strong>${comment.username}</strong>
                            <span class="comment-time">${comment.created_at}</span>
                        </div>
                        <p>${comment.content}</p>
                    </div>
                `;
            });
            commentsHtml += '</div>';
        }
        
        modalBody.innerHTML = `
            <div class="knowledge-detail">
                <div class="detail-header">
                    <h2>${data.title}</h2>
                    <div class="detail-tags">
                        <span class="tag">${data.category}</span>
                        <span class="tag">${data.season}</span>
                        <span class="view-tag">👁 ${data.view_count} 次浏览</span>
                    </div>
                </div>
                
                <div class="detail-content">
                    <section>
                        <h3>📖 详细介绍</h3>
                        <p>${data.content}</p>
                    </section>
                    
                    <section>
                        <h3>✨ 功效益处</h3>
                        <p>${data.benefits}</p>
                    </section>
                    
                    <section>
                        <h3>⚠️ 注意事项</h3>
                        <p>${data.precautions}</p>
                    </section>
                    
                    <section>
                        <h3>👥 适宜人群</h3>
                        <p>${data.suitable_crowd}</p>
                    </section>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-favorite ${data.is_favorited ? 'favorited' : ''}" 
                            onclick="toggleFavorite(${data.id})">
                        ${data.is_favorited ? '❤️ 已收藏' : '🤍 收藏'}
                    </button>
                    <button class="btn-comment" onclick="showCommentForm(${data.id})">
                        💬 发表评论
                    </button>
                </div>
                
                <div id="commentForm-${data.id}" class="comment-form" style="display: none;">
                    <textarea id="commentText-${data.id}" placeholder="分享您的养生心得..."></textarea>
                    <button onclick="submitComment(${data.id})">发表</button>
                </div>
                
                ${commentsHtml}
            </div>
        `;
        
        modal.style.display = 'block';
        
        // 添加动画效果
        setTimeout(() => {
            modal.querySelector('.knowledge-detail').classList.add('fade-in');
        }, 10);
        
    } catch (error) {
        console.error('获取知识详情失败:', error);
        showNotification('获取详情失败,请稍后重试', 'error');
    }
}

// 切换收藏状态
async function toggleFavorite(knowledgeId) {
    try {
        const response = await fetch(`/api/favorite/${knowledgeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            showNotification('请先登录', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }
        
        const data = await response.json();
        showNotification(data.message, 'success');
        
        // 更新按钮状态
        const btn = document.querySelector('.btn-favorite');
        if (btn) {
            if (data.status === 'added') {
                btn.classList.add('favorited');
                btn.innerHTML = '❤️ 已收藏';
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = '🤍 收藏';
            }
        }
        
    } catch (error) {
        console.error('收藏操作失败:', error);
        showNotification('操作失败,请稍后重试', 'error');
    }
}

// 显示评论表单
function showCommentForm(knowledgeId) {
    const form = document.getElementById(`commentForm-${knowledgeId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// 提交评论
async function submitComment(knowledgeId) {
    const textarea = document.getElementById(`commentText-${knowledgeId}`);
    const content = textarea.value.trim();
    
    if (!content) {
        showNotification('请输入评论内容', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/comment/${knowledgeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.status === 401) {
            showNotification('请先登录', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }
        
        const data = await response.json();
        showNotification('评论发表成功', 'success');
        
        // 清空输入框并刷新知识详情
        textarea.value = '';
        showKnowledgeDetail(knowledgeId);
        
    } catch (error) {
        console.error('评论失败:', error);
        showNotification('评论失败,请稍后重试', 'error');
    }
}

// 按分类筛选
function filterByCategory(category) {
    currentCategory = category;
    
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 筛选显示
    const items = document.querySelectorAll('.knowledge-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            item.classList.add('fade-in');
        } else {
            item.style.display = 'none';
        }
    });
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('knowledgeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `flash-message flash-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 添加进入动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 自动隐藏Flash消息
function autoHideFlashMessages() {
    const messages = document.querySelectorAll('.flash-message');
    messages.forEach(msg => {
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateX(100%)';
            setTimeout(() => {
                msg.remove();
            }, 300);
        }, 3000);
    });
}

// 初始化知识图谱
function initializeGraph() {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // 节点数据
    const nodes = [
        { x: canvas.width/2, y: canvas.height/2, label: '养生知识', size: 30, color: '#8B4513' },
        { x: canvas.width/3, y: canvas.height/3, label: '传统功法', size: 20, color: '#D2691E' },
        { x: canvas.width*2/3, y: canvas.height/3, label: '中医疗法', size: 20, color: '#D2691E' },
        { x: canvas.width/2, y: canvas.height*2/3, label: '饮食养生', size: 20, color: '#D2691E' },
        { x: canvas.width/4, y: canvas.height/2, label: '八段锦', size: 15, color: '#FFD700' },
        { x: canvas.width*3/4, y: canvas.height/2, label: '艾灸', size: 15, color: '#FFD700' },
        { x: canvas.width/2, y: canvas.height/4, label: '太极拳', size: 15, color: '#FFD700' },
        { x: canvas.width/3, y: canvas.height*3/4, label: '药膳', size: 15, color: '#FFD700' },
        { x: canvas.width*2/3, y: canvas.height*3/4, label: '茶道', size: 15, color: '#FFD700' }
    ];
    
    // 连接线
    const edges = [
        [0, 1], [0, 2], [0, 3],
        [1, 4], [1, 6],
        [2, 5],
        [3, 7], [3, 8]
    ];
    
    // 动画参数
    let animationFrame = 0;
    
    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制连接线
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 2;
        edges.forEach(edge => {
            const start = nodes[edge[0]];
            const end = nodes[edge[1]];
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
        
        // 绘制节点
        nodes.forEach((node, index) => {
            // 添加呼吸效果
            const breathe = Math.sin(animationFrame * 0.02 + index) * 3;
            const size = node.size + breathe;
            
            // 绘制节点圆圈
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制文字
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);
        });
        
        animationFrame++;
        requestAnimationFrame(drawGraph);
    }
    
    drawGraph();
    
    // 响应窗口大小变化
    window.addEventListener('resize', () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        // 重新计算节点位置
        nodes[0] = { ...nodes[0], x: canvas.width/2, y: canvas.height/2 };
        nodes[1] = { ...nodes[1], x: canvas.width/3, y: canvas.height/3 };
        nodes[2] = { ...nodes[2], x: canvas.width*2/3, y: canvas.height/3 };
        nodes[3] = { ...nodes[3], x: canvas.width/2, y: canvas.height*2/3 };
        nodes[4] = { ...nodes[4], x: canvas.width/4, y: canvas.height/2 };
        nodes[5] = { ...nodes[5], x: canvas.width*3/4, y: canvas.height/2 };
        nodes[6] = { ...nodes[6], x: canvas.width/2, y: canvas.height/4 };
        nodes[7] = { ...nodes[7], x: canvas.width/3, y: canvas.height*3/4 };
        nodes[8] = { ...nodes[8], x: canvas.width*2/3, y: canvas.height*3/4 };
    });
}

// 初始化动画效果
function initializeAnimations() {
    // 滚动显示动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    document.querySelectorAll('.knowledge-item, .popular-card, .knowledge-card').forEach(el => {
        observer.observe(el);
    });
    
    // 为卡片添加悬浮效果
    document.querySelectorAll('.knowledge-card, .popular-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeSearchModal();
    }
});

// 添加CSS样式用于动画
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .search-results-grid {
        display: grid;
        gap: 20px;
        margin-top: 20px;
    }
    
    .search-result-item {
        background: var(--bg-cream);
        padding: 20px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .search-result-item:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-hover);
    }
    
    .result-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    
    .category-badge {
        background: var(--primary-color);
        color: white;
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
    }
    
    .result-header h4 {
        color: var(--text-dark);
        margin: 0;
    }
    
    .search-result-item p {
        color: var(--text-light);
        margin: 0;
    }
    
    .knowledge-detail {
        max-width: 100%;
    }
    
    .detail-header {
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 20px;
        margin-bottom: 20px;
    }
    
    .detail-header h2 {
        color: var(--primary-color);
        margin-bottom: 15px;
    }
    
    .detail-tags {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .tag {
        background: var(--accent-color);
        color: var(--text-dark);
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.9rem;
    }
    
    .view-tag {
        color: var(--text-light);
    }
    
    .detail-content section {
        margin-bottom: 25px;
    }
    
    .detail-content h3 {
        color: var(--primary-color);
        margin-bottom: 10px;
        font-size: 1.2rem;
    }
    
    .detail-content p {
        color: var(--text-dark);
        line-height: 1.8;
    }
    
    .detail-actions {
        display: flex;
        gap: 15px;
        margin: 30px 0;
    }
    
    .btn-favorite, .btn-comment {
        padding: 10px 25px;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s ease;
    }
    
    .btn-favorite {
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        color: white;
    }
    
    .btn-favorite.favorited {
        background: #FF6B6B;
    }
    
    .btn-comment {
        background: var(--accent-color);
        color: var(--text-dark);
    }
    
    .btn-favorite:hover, .btn-comment:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-hover);
    }
    
    .comment-form {
        margin: 20px 0;
    }
    
    .comment-form textarea {
        width: 100%;
        padding: 15px;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        resize: vertical;
        min-height: 100px;
        font-size: 1rem;
        font-family: inherit;
    }
    
    .comment-form button {
        margin-top: 10px;
        padding: 10px 30px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .comment-form button:hover {
        background: var(--secondary-color);
        transform: translateY(-2px);
    }
    
    .comments-section {
        margin-top: 30px;
        padding-top: 30px;
        border-top: 2px solid var(--border-color);
    }
    
    .comments-section h4 {
        color: var(--primary-color);
        margin-bottom: 20px;
    }
    
    .comment-item {
        background: var(--bg-cream);
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 15px;
    }
    
    .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    
    .comment-header strong {
        color: var(--primary-color);
    }
    
    .comment-time {
        color: var(--text-light);
        font-size: 0.85rem;
    }
    
    .comment-item p {
        color: var(--text-dark);
        line-height: 1.6;
        margin: 0;
    }
`;
document.head.appendChild(style);
