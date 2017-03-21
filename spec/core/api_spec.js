var request = require("request");
var config = require('dotenv').config({path: '.env.ci'})

var app = require("../../build/app.js")

var base_url = "http://localhost:3002/api"

describe("gateway", function() {
  describe("GET default route /api", function() {
    it("returns status code 200", function(done) {
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(200);
        done();
      });

    });
  });
});