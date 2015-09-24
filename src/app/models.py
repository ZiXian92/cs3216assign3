from datetime import datetime, timedelta

from app import db
from sqlalchemy.exc import IntegrityError

# post_like_table = db.Table('post_like', db.Model.metadata,
#                            db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
#                            db.Column('post_id', db.String, db.ForeignKey('posts.id'))
#                            )

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
    # like_articles = db.relationship("Post", secondary=post_like_table, backref="likes")
    bookmark_articles = db.relationship("Post", secondary=post_bookmark_table, backref="bookmarks")

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
        for category_name in ['Self-help', 'Money', 'Technology', 'Lifestyle', 'Others']:
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
        return sorted(self.posts, key=lambda x: x.create_time, reverse=True)[offset:offset + limit]


class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.String, primary_key=True)
    title = db.Column(db.String)
    image = db.Column(db.String)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def get_by_id(cls, source_id, post_id):
        return cls.query.get('{}/{}'.format(source_id, post_id))

    def insert(self):
        try:
            db.session.add(self)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise

    def get_id(self):
        return {'source': self.id.split('/')[0], 'article_id': self.id.split('/')[1]}

    def to_dict(self):
        return {'title': self.title, 'source': self.id.split('/')[0], 'article_id': self.id.split('/')[1],
                'image': self.image, 'time': self.create_time.isoformat(), 'category': self.categories[0].name,
                'bookmarks': len(self.bookmarks)}

    @classmethod
    def get_trending(cls, days, offset, limit):
        return sorted(filter(lambda x: len(x.bookmarks),
                             cls.query.filter(cls.create_time > (datetime.utcnow() - timedelta(days=days))).
                             order_by('create_time DESC').all()),
                      key=lambda x: len(x.bookmarks), reverse=True)[offset: offset + limit]

    @classmethod
    def get_paginated(cls, offset, limit):
        return cls.query.order_by('create_time DESC').limit(limit).offset(offset).all()
