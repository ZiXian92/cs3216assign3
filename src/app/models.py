from datetime import datetime

from app import db
from sqlalchemy.exc import IntegrityError

post_like_table = db.Table('post_like', db.Model.metadata,
                           db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
                           db.Column('post_id', db.String, db.ForeignKey('posts.id'))
                           )

post_bookmark_table = db.Table('post_bookmark', db.Model.metadata,
                               db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
                               db.Column('post_id', db.String, db.ForeignKey('posts.id'))
                               )

post_category_association_table = db.Table('post_category_association', db.Model.metadata,
                                           db.Column('category_id', db.Integer, db.ForeignKey('categories.id')),
                                           db.Column('post_id', db.String, db.ForeignKey('posts.id'))
                                           )


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String)
    display_name = db.Column(db.String)
    like_articles = db.relationship("Post", secondary=post_like_table)
    bookmark_articles = db.relationship("Post", secondary=post_bookmark_table)

    @classmethod
    def get_by_id(cls, id):
        return cls.query.get(id)

    def insert(self):
        try:
            db.session.add(self)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise


class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)
    posts = db.relationship("Post", secondary=post_category_association_table, backref="categories")

    @classmethod
    def create_categories(cls):
        for category_name in ['Self-help', 'Money', 'Technology', 'Work', 'Lifestyle', 'Others']:
            category = Category(name=category_name)
            try:
                db.session.add(category)
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    @classmethod
    def get_all(cls):
        return cls.query.all()

    @classmethod
    def get_by_name(cls, name):
        return cls.query.filter_by(name=name).first()

    @classmethod
    def get_by_id(cls, id):
        return cls.query.get(id)

    def get_paginated_articles(self, offset, limit):
        return self.posts[offset:offset + limit]


class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.String, primary_key=True)
    title = db.Column(db.String)
    image = db.Column(db.String)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    def insert(self):
        try:
            db.session.add(self)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise

    def to_dict(self):
        return {'title': self.title, 'source': self.id.split('/')[0], 'article_id': self.id.split('/')[1],
                'image': self.image, 'time': self.create_time.isoformat(), 'category': self.categories[0].name}

    @classmethod
    def get_paginated(cls, offset, limit):
        return cls.query.order_by('create_time DESC').limit(limit).offset(offset).all()
