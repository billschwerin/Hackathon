module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class CreateChannels extends Nodal.Migration {

    constructor(db) {
      super(db);
      this.id = 2016062720130778;
    }

    up() {

      return [
        this.createTable("channels", [{"name":"friendly_name","type":"string"},{"name":"urn","type":"string"}, {"name":"subject","type":"string"}, {"name":"channel","type":"string"}, {"name":"category","type":"string"}, {"name":"favorite","type":"boolean"}])
      ];

    }

    down() {

      return [
        this.dropTable("channels")
      ];

    }

  }

  return CreateChannels;

})();
