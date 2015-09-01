var express = require('express');
var router = express.Router();
var path = require('path');
var indexHtmlPath = path.join(__dirname, '../views/index.html');
var socket = require('socket.io');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(indexHtmlPath);
});

module.exports = router;
