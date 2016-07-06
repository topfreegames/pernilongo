# pernilongo
# https://github.com/topfreegames/pernilongo
#
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license
# Copyright © 2016 Top Free Games <backend@tfgco.com>

setup-ci:
	@npm install

test-ci: test

test: run-tests

run-tests:
	@./node_modules/mocha/bin/mocha tests/integration/
