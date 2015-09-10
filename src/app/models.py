from datetime import datetime

from app import db


category_association_table = db.Table('category_association', db.Model.metadata,
                                      db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
                                      db.Column('category_id', db.Integer, db.ForeignKey('categories.id'))
)

post_association_table = db.Table('post_association', db.Model.metadata,
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
    categories = db.relationship("Category", secondary=category_association_table)
    posts = db.relationship("Post", secondary=post_association_table)


class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    posts = db.relationship("Post", secondary=post_category_association_table, backref="categories")


class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.String, primary_key=True)
    title = db.Column(db.String)
    image = db.Column(db.String)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)
