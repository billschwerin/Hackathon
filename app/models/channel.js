module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');

  class Channel extends Nodal.Model {}

  Channel.setDatabase(Nodal.require('db/main.js'));
  Channel.setSchema(Nodal.my.Schema.models.Channel);

  return Channel;

})();
