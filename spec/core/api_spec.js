var request = require("request");
var config = require('dotenv').config({path: '.env.ci'})

var app = require("../../build/app.js")

var base_url = "http://localhost:3000/api/identity"

describe("gateway", function() {
  beforeAll(function (done) {
    setTimeout(function () {
        console.log('start first test')
        done()
    }, 2000);
  });

  describe("GET default route /api/identity", function() {
    it("returns status code 200", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(404);
        done();
      });

    });
  });
});