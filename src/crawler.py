from app import parsers, models, db, utils
from sqlalchemy.exc import IntegrityError


db.create_all()
models.Category.create_categories()


def main():
    posts = [item for parser in parsers.parsers.values() for item in parser.crawl()]
    for post in posts:
        new_post = models.Post(id="{}/{}".format(post['source'], post['id']),
                               title=post['title'],
                               image=post['image'],
                               create_time=post['create_time'])
        try:
            new_post.insert()
            category = models.Category.get_by_name(post['category'])
            category.posts.append(new_post)
            utils.get_cached_post(post['source'], post['id'])
            db.session.commit()
        except IntegrityError:
            pass


if __name__ == '__main__':
    main()
