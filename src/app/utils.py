from app import mc, parsers


def post_key(source_id, post_id):
    return 'POST:{}:{}'.format(source_id, post_id)


def get_cached_post(source_id, post_id):
    cached_data = mc.get(post_key(source_id, post_id))
    if cached_data:
        return cached_data
    parser = parsers.parsers[source_id]
    data = parser.parse_post(post_id)
    mc.set(post_key(source_id, post_id), data, time=3600*24*7)
    return data
