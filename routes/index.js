var express = require('express');
// var fs = require('fs');
// var path = require('path');
var db = require('../models/photoDB');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    db.Album.find({}).sort({sort: 1}).exec(function (err, albums) {
        if (err) {
            console.log('query albums failed');
        }
        db.Photo.find({}).sort({sort: 1}).exec(function (err, images) {
            if (err) {
                console.log('query photos failed');
            }
            // console.log(albums, images);
            res.render('index', { albums: albums, images: images });
        });
    });
});

module.exports = router;
