var express = require('express');
var db = require('../models/photoDB');
var fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');

var router = express.Router();
var multipartMiddleware = multipart({uploadDir: 'temp'});

// ajax handling
router.post('/deleteAlbum', function(req, res, next) {
    var _id = req.body._id,
        name = req.body.name;
    var status = 200,
        msg = {
            title: 'success',
            content: 'remove album ' + name
        };
    db.Album.remove({_id: _id}, function (err) {
        if (err) {
            console.log('remove album %s failed', name);
            status = 500;
            msg.title = 'failed';
        }
        res.status(status).send(msg);
    })
});

router.post('/renameAlbum', function(req, res, next) {
    var _id = req.body._id,
        oldName = req.body.oldName,
        newName = req.body.newName;
    var status = 200,
        msg = {
            title: 'success',
            content: 'rename album ' + oldName + ' to ' + newName
        };
    db.Album.update({_id: _id}, {name: newName}, function (err, raw) {
        if (err) {
            console.log('rename album %s failed', oldName);
            status = 500;
            msg.title = 'failed';
        }
        msg.raw = raw;
        res.status(status).send(msg);
    })
});

router.post('/addAlbum', function(req, res, next) {
    var name = req.body.name,
        quantity = req.body.quantity;
    var status = 200,
        msg = {
            title: 'success',
            content: 'create new album ' + name
        };
    db.Album.create({
        name: name,
        quantity: quantity
    }, function (err, doc) {
        if (err) {
            console.log('create new album %s failed', name);
            status = 500;
            msg.title = 'failed';
        }
        msg.album = doc;
        res.status(status).send(msg);
    })
});

router.post('/addPhoto', multipartMiddleware, function(req, res, next) {
    var name = req.files.file.name;
    var src = path.join('public/images', name);
    var status = 200,
        msg = {
            title: 'success',
            content: 'import a new photo'
        }

    // console.log(req.files.image);
    fs.rename(req.files.file.path, src, function (err) {
        if(err) {
            console.log('photo move error');
            status = 500;
            msg.title = 'failed';
        }
        db.Photo.create({
            name: name,
            src: src
        }, function (err, doc) {
            if(err) {
                console.log('save to db error');
                status = 500;
                msg.title = 'failed';
            }
            console.log(doc);
            msg.photo = doc;
            res.status(status).send(msg);
        });
    });
});

router.post('/deletePhoto', function(req, res, next) {
    var _id = req.body._id,
        name = req.body.name;
    var status = 200,
        msg = {
            title: 'success',
            content: 'remove photo ' + name
        };

    db.Photo.remove({_id: _id}, function (err) {
        if (err) {
            console.log('remove photo %s failed', name);
            status = 500;
            msg.title = 'failed';
        }
        res.status(status).send(msg);
    })
});

module.exports = router;