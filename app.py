from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta,timezone
import json
import random
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'qihuang-youth-2024-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

db = SQLAlchemy(app)

# 数据模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='user', lazy=True, cascade='all, delete-orphan')
    search_history = db.relationship('SearchHistory', backref='user', lazy=True, cascade='all, delete-orphan')

class Knowledge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    benefits = db.Column(db.Text)
    precautions = db.Column(db.Text)
    suitable_crowd = db.Column(db.String(200))
    season = db.Column(db.String(50))
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    favorites = db.relationship('Favorite', backref='knowledge', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='knowledge', lazy=True, cascade='all, delete-orphan')

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    knowledge_id = db.Column(db.Integer, db.ForeignKey('knowledge.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    knowledge_id = db.Column(db.Integer, db.ForeignKey('knowledge.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    keyword = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 登录装饰器
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('请先登录', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# 初始化数据库和示例数据
def init_db():
    with app.app_context():
        db.create_all()
        
        # 检查是否已有数据
        if Knowledge.query.first() is None:
            sample_knowledge = [
                {
                    'title': '八段锦',
                    'category': '传统功法',
                    'content': '八段锦是中国古代传统保健功法，由八节动作组成。包括：双手托天理三焦、左右开弓似射雕、调理脾胃须单举、五劳七伤往后瞧、摇头摆尾去心火、两手攀足固肾腰、攒拳怒目增气力、背后七颠百病消。',
                    'benefits': '调理气血、强身健体、疏通经络、增强免疫力',
                    'precautions': '动作要柔和，呼吸要自然，不可用力过猛',
                    'suitable_crowd': '大学生、办公族、中老年人',
                    'season': '四季皆宜'
                },
                {
                    'title': '五禽戏',
                    'category': '传统功法',
                    'content': '五禽戏是华佗创编的养生功法，模仿虎、鹿、熊、猿、鸟五种动物的动作。虎戏主肝，鹿戏主肾，熊戏主脾，猿戏主心，鸟戏主肺。',
                    'benefits': '平衡阴阳、调和气血、活动筋骨、增强体质',
                    'precautions': '初学者应循序渐进，避免动作过大',
                    'suitable_crowd': '青年学生、亚健康人群',
                    'season': '春夏秋冬'
                },
                {
                    'title': '艾灸养生',
                    'category': '中医疗法',
                    'content': '艾灸是用艾叶制成的艾条、艾柱，点燃后熏烤人体穴位的中医疗法。常用穴位有足三里、关元、气海、神阙等。',
                    'benefits': '温经散寒、行气活血、扶阳固脱、防病保健',
                    'precautions': '孕妇慎用，皮肤破损处禁用，注意防烫伤',
                    'suitable_crowd': '体质虚寒者、慢性疲劳者',
                    'season': '秋冬季节尤佳'
                },
                {
                    'title': '药膳食疗',
                    'category': '饮食养生',
                    'content': '药膳是将中药材与食材相配伍，既有药物功效又有食品美味的特殊膳食。如枸杞红枣茶、山药薏米粥、银耳莲子羹等。',
                    'benefits': '调理体质、预防疾病、延缓衰老、美容养颜',
                    'precautions': '需根据个人体质选择，不可盲目进补',
                    'suitable_crowd': '所有人群',
                    'season': '根据季节调整配方'
                },
                {
                    'title': '太极拳',
                    'category': '传统功法',
                    'content': '太极拳是内外兼修、刚柔相济的中国传统拳术。强调意念引导，以静制动，以柔克刚。包含起势、野马分鬃、白鹤亮翅等经典动作。',
                    'benefits': '增强体质、改善心肺功能、缓解压力、提高平衡能力',
                    'precautions': '膝关节要放松，不可过度下蹲',
                    'suitable_crowd': '学生、白领、老年人',
                    'season': '全年适宜'
                },
                {
                    'title': '刮痧疗法',
                    'category': '中医疗法',
                    'content': '刮痧是用刮痧板蘸刮痧油反复刮动、摩擦患者皮肤，以治疗疾病的方法。可疏通经络、活血化瘀。',
                    'benefits': '祛风散寒、疏通经络、调和气血、排毒养颜',
                    'precautions': '皮肤病患者禁用，饭后一小时内不宜刮痧',
                    'suitable_crowd': '肩颈不适者、亚健康人群',
                    'season': '夏季为佳'
                },
                {
                    'title': '站桩功',
                    'category': '传统功法',
                    'content': '站桩功是通过站立不动的姿势进行锻炼的养生功法。基本姿势：两脚分开与肩同宽，膝微屈，双手抱圆于胸前。',
                    'benefits': '培元固本、增强体力、改善气血、提高专注力',
                    'precautions': '初练时间不宜过长，循序渐进',
                    'suitable_crowd': '学习压力大的学生、脑力工作者',
                    'season': '四季皆可'
                },
                {
                    'title': '茶道养生',
                    'category': '饮食养生',
                    'content': '中国茶道讲究茶的选择、泡制和品饮。绿茶清热，红茶暖胃，普洱茶降脂，乌龙茶去腻，白茶清火。',
                    'benefits': '提神醒脑、抗氧化、降血脂、助消化',
                    'precautions': '空腹不宜饮浓茶，睡前少饮',
                    'suitable_crowd': '大学生、职场人士',
                    'season': '春饮花茶、夏饮绿茶、秋饮乌龙、冬饮红茶'
                },
                {
                    'title': '经络拍打',
                    'category': '中医疗法',
                    'content': '通过拍打身体经络和穴位，疏通气血、排除毒素。常拍打手三阴三阳经、足三阴三阳经等。',
                    'benefits': '疏通经络、促进血液循环、缓解疲劳、增强免疫',
                    'precautions': '力度适中，避免过重造成损伤',
                    'suitable_crowd': '久坐人群、运动不足者',
                    'season': '全年适用'
                },
                {
                    'title': '导引术',
                    'category': '传统功法',
                    'content': '导引术是通过肢体运动、呼吸吐纳、意念活动来锻炼身体的传统养生方法。包括马王堆导引术、易筋经等。',
                    'benefits': '舒筋活络、调和气血、强身健体、延年益寿',
                    'precautions': '呼吸要自然，动作要缓慢',
                    'suitable_crowd': '各年龄段人群',
                    'season': '春夏秋冬皆宜'
                }
            ]
            
            for item in sample_knowledge:
                knowledge = Knowledge(**item)
                db.session.add(knowledge)
            
            db.session.commit()

# 路由
@app.route('/')
def index():
    # 获取所有养生知识
    knowledges = Knowledge.query.all()
    
    # 获取热门内容（按浏览量排序）
    popular = Knowledge.query.order_by(Knowledge.view_count.desc()).limit(3).all()
    
    # 如果用户登录，获取个性化推荐
    recommendations = []
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            # 基于用户搜索历史和收藏推荐
            favorited_categories = db.session.query(Knowledge.category).join(
                Favorite, Favorite.knowledge_id == Knowledge.id
            ).filter(Favorite.user_id == user.id).distinct().all()
            
            if favorited_categories:
                categories = [c[0] for c in favorited_categories]
                recommendations = Knowledge.query.filter(
                    Knowledge.category.in_(categories)
                ).order_by(db.func.random()).limit(3).all()
    
    # 如果没有个性化推荐，随机推荐
    if not recommendations:
        recommendations = Knowledge.query.order_by(db.func.random()).limit(3).all()
    
    return render_template('index.html', 
                         knowledges=knowledges, 
                         popular=popular,
                         recommendations=recommendations,
                         user_logged_in='user_id' in session,
                         username=session.get('username'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # 验证用户是否已存在
        if User.query.filter_by(username=username).first():
            flash('用户名已存在', 'error')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('邮箱已被注册', 'error')
            return redirect(url_for('register'))
        
        # 创建新用户
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        
        flash('注册成功！请登录', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session.permanent = True
            flash('登录成功！', 'success')
            return redirect(url_for('index'))
        else:
            flash('用户名或密码错误', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('已退出登录', 'info')
    return redirect(url_for('index'))

# API路由
# 在 app.py 的 API 路由部分，添加这个新函数
@app.route('/api/user/profile')
@login_required
def user_profile():
    user_id = session['user_id']

    # 1. 查询统计数据
    favorite_count = Favorite.query.filter_by(user_id=user_id).count()
    comment_count = Comment.query.filter_by(user_id=user_id).count()

    # 2. 查询所有收藏的知识条目
    favorites = Favorite.query.filter_by(user_id=user_id).order_by(Favorite.created_at.desc()).all()

    # 3. 构建收藏列表
    favorites_data = []
    for fav in favorites:
        knowledge = fav.knowledge
        favorites_data.append({
            'id': knowledge.id,
            'title': knowledge.title,
            'category': knowledge.category,
            'content_preview': knowledge.content[:80] + '...' if len(knowledge.content) > 80 else knowledge.content
        })

    # 4. 返回JSON数据
    return jsonify({
        'username': session.get('username'),
        'stats': {
            'favorites': favorite_count,
            'comments': comment_count
        },
        'favorites': favorites_data
    })

@app.route('/api/search')
def search():
    keyword = request.args.get('q', '')
    if not keyword:
        return jsonify({'results': []})
    
    # 记录搜索历史
    if 'user_id' in session:
        search_history = SearchHistory(
            user_id=session['user_id'],
            keyword=keyword
        )
        db.session.add(search_history)
        db.session.commit()
    
    # 搜索知识库
    results = Knowledge.query.filter(
        db.or_(
            Knowledge.title.contains(keyword),
            Knowledge.content.contains(keyword),
            Knowledge.category.contains(keyword)
        )
    ).all()
    
    return jsonify({
        'results': [{
            'id': k.id,
            'title': k.title,
            'category': k.category,
            'content': k.content[:100] + '...' if len(k.content) > 100 else k.content
        } for k in results]
    })

@app.route('/api/knowledge/<int:id>')
def get_knowledge(id):
    knowledge = Knowledge.query.get_or_404(id)
    
    # 增加浏览量
    knowledge.view_count += 1
    db.session.commit()
    
    # 检查是否已收藏
    is_favorited = False
    if 'user_id' in session:
        favorite = Favorite.query.filter_by(
            user_id=session['user_id'],
            knowledge_id=id
        ).first()
        is_favorited = favorite is not None
    
    # 获取评论
    comments = Comment.query.filter_by(knowledge_id=id).order_by(Comment.created_at.desc()).all()
    
    return jsonify({
        'id': knowledge.id,
        'title': knowledge.title,
        'category': knowledge.category,
        'content': knowledge.content,
        'benefits': knowledge.benefits,
        'precautions': knowledge.precautions,
        'suitable_crowd': knowledge.suitable_crowd,
        'season': knowledge.season,
        'view_count': knowledge.view_count,
        'is_favorited': is_favorited,
        'comments': [{
            'id': c.id,
            'username': c.user.username,
            'content': c.content,
            'created_at': c.created_at.strftime('%Y-%m-%d %H:%M')
        } for c in comments]
    })

@app.route('/api/favorite/<int:knowledge_id>', methods=['POST'])
@login_required
def toggle_favorite(knowledge_id):
    knowledge = Knowledge.query.get_or_404(knowledge_id)
    
    favorite = Favorite.query.filter_by(
        user_id=session['user_id'],
        knowledge_id=knowledge_id
    ).first()
    
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'status': 'removed', 'message': '已取消收藏'})
    else:
        favorite = Favorite(
            user_id=session['user_id'],
            knowledge_id=knowledge_id
        )
        db.session.add(favorite)
        db.session.commit()
        return jsonify({'status': 'added', 'message': '收藏成功'})

@app.route('/api/comment/<int:knowledge_id>', methods=['POST'])
@login_required
def add_comment(knowledge_id):
    knowledge = Knowledge.query.get_or_404(knowledge_id)
    content = request.json.get('content', '').strip()
    
    if not content:
        return jsonify({'error': '评论内容不能为空'}), 400
    
    beijing_tz = timezone(timedelta(hours=8))
    
    comment = Comment(
        user_id=session['user_id'],
        knowledge_id=knowledge_id,
        content=content,
        created_at=datetime.now(beijing_tz)
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'id': comment.id,
        'username': comment.user.username,
        'content': comment.content,
        'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M')
    })

@app.route('/api/user/favorites')
@login_required
def user_favorites():
    favorites = Favorite.query.filter_by(user_id=session['user_id']).all()
    
    return jsonify({
        'favorites': [{
            'id': f.knowledge.id,
            'title': f.knowledge.title,
            'category': f.knowledge.category,
            'created_at': f.created_at.strftime('%Y-%m-%d')
        } for f in favorites]
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)