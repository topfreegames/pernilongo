# pernilongo
# https://github.com/topfreegames/pernilongo
#
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license
# Copyright © 2016 Top Free Games <backend@tfgco.com>

setup-ci:
	@npm install

test-ci: test

test: run-deps run-test-game-server run-tests kill-game-server kill-deps

run-test-game-server:
	@rm -rf /tmp/kublai-pomelo.log
	@POMELO_REDIS_PORT=7677 MONGO_URL=mongodb://localhost:27017/mqtt node example/app.js host=127.0.0.1 port=3334 clientPort=3010 frontend=true serverType=connector 2>&1 > /tmp/kublai-pomelo.log &
	@sleep 3

kill-game-server:
	@ps aux | egrep 'example/app.js' | egrep -v egrep | awk ' { print $$2 } ' | xargs kill -9

run-tests:
	@npm test

# get a redis instance up (localhost:3434)
run-deps:
	@docker-compose up -d 
	@sleep 5

# kill this redis instance (localhost:3434)
kill-deps:
	@docker-compose down