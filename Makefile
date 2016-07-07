# pernilongo
# https://github.com/topfreegames/pernilongo
#
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license
# Copyright © 2016 Top Free Games <backend@tfgco.com>

setup-ci:
	@npm install

test-ci: test

test: redis run-test-game-server run-tests kill-game-server kill-redis

run-test-game-server: redis
	@rm -rf /tmp/kublai-pomelo.log
	@REDIS_URL=//localhost:3434 node example/app.js host=127.0.0.1 port=3334 clientPort=3333 frontend=true serverType=connector 2>&1 > /tmp/kublai-pomelo.log &
	@sleep 3

kill-game-server:
	@ps aux | egrep 'example/app.js' | egrep -v egrep | awk ' { print $$2 } ' | xargs kill -9

run-tests:
	@npm test

# get a redis instance up (localhost:3434)
redis:
	@redis-server ./tests/redis.conf; sleep 1
	@redis-cli -p 3434 info > /dev/null

# kill this redis instance (localhost:3434)
kill-redis:
	@-redis-cli -p 3434 shutdown
