#!/bin/bash

pip3 install -r requirements.txt
/usr/local/opt/memcached/bin/memcached &
python3 src/crawler.py &
python3 src/run.py &
