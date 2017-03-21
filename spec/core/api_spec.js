var request = require("request");

var base_url = "http://localhost:3000/core/identity"

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