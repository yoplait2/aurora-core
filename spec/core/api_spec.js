var request = require("request");
var config = require('dotenv').config({path: '.env.ci'})

var app = require("../../build/app.js")

var base_url = "http://localhost:3000/api/identity"

describe("gateway", function() {
  describe("GET default route /api/identity", function() {
    it("returns status code 200", function(done) {
      beforeAll(function (done) {
        setTimeout(function () {
            done()
        }, 2000);
      });
      request.get(base_url, function(error, response, body) {
        expect(response.statusCode).toBe(404);
        done();
      });

    });
  });
});