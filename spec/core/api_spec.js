var request = require("request");
var config = require('dotenv').config({path: '.env.ci'})

var app = require("../../build/app.js")

var base_url = "http://localhost:3000/core/identity"

beforeAll(function (done) {
    setTimeout(function () {
        done()
    }, 5000);
});

describe("gateway", function() {
  describe("GET default route /core/identity", function() {
    it("returns status code 200", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });

    });
  });
});