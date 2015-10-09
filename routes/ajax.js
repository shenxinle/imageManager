var express = require('express');
var db = require('../models/photoDB');
var fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');

var router = express.Router();
var multipartMiddleware = multipart({uploadDir: 'temp'});


router.post('/getAlbum', function(req, res, next) {
    var _id = req.body._id,
        name = req.body.name;
    var status = 200,
        msg = {
            title: 'success',
            content: 'get album ' + name
        };
    db.Photo.find({}).sort({sort: 1}).exec(function (err, images) {
        if(err) {
            console.log('query images failed');
            status = 500;
            msg.title = 'failed';
        }
        var filterImages = name === '全部' ? images : images.filter(function (item, index, arr) {
            if(item.albums.search(_id) !== -1) {
                return true;
            }
            return false;
        });
        msg.images = filterImages;
        res.status(status).send(msg);
    });
});

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
        quantity = req.body.quantity,
        sort = req.body.sort;
    var status = 200,
        msg = {
            title: 'success',
            content: 'create new album ' + name
        };
    db.Album.create({
        name: name,
        quantity: quantity,
        sort: sort
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
    var sort = req.body.sort;
    var album = {
        _id: req.body.albumId,
        name: req.body.albumName
    };

    var status = 200,
        msg = {
            title: 'success',
            content: 'import a new photo'
        }

    // console.log(album);
    fs.rename(req.files.file.path, src, function (err) {
        var albumId = album.name === '全部' ? '' : album._id;
        if(err) {
            console.log('photo move error');
            status = 500;
            msg.title = 'failed';
            res.status(status).send(msg);
        }
        db.Photo.create({
            name: name,
            src: src,
            albums: albumId,
            sort: sort
        }, function (err, doc) {
            if(err) {
                console.log('save to db error');
                status = 500;
                msg.title = 'failed';
                res.status(status).send(msg);
            }
            msg.photo = doc;
            // db.Album update
            db.Album.findOne({_id: album._id}, function (err, doc) {
                var quan = doc.quantity;
                db.Album.update({_id: album._id}, {quantity: quan+1}, function (err, raw) {
                    if (album.name !== '全部') {
                        db.Album.findOne({name: '全部'}, function (err, doc) {
                            var quanAll = doc.quantity;
                            db.Album.update({_id: doc._id}, {quantity: quanAll+1}, function (err, raw) {
                                res.status(status).send(msg);
                            });
                        });
                    } else {
                        res.status(status).send(msg);
                    }
                });
            });
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

    db.Photo.findOne({_id: _id}).exec(function (err, doc) {
        msg.photo = doc;
        db.Photo.remove({_id: _id}, function (err) {
            if (err) {
                console.log('remove photo %s failed', name);
                status = 500;
                msg.title = 'failed';
            }
            // db.Album quantity update
            if (msg.photo.albums) {
                msg.photo.albums.split(/\s*,\s*/).forEach(function (item, index, arr) {
                    db.Album.findOne({_id: item}, function (err, doc) {
                        if (err) {
                            console.log('deletePhoto----db.Album quantity update error');
                        } else {
                            doc.quantity--;
                            doc.save();
                        }
                    });
                });
            }
            db.Album.findOne({name: '全部'}, function (err, doc) {
                doc.quantity--;
                doc.save();
            });

            res.status(status).send(msg);
        });
    });
});

router.post('/getOperationPhotoInfo', function(req, res, next) {
    var _id = req.body._id,
        name = req.body.name;
    var status = 200,
        msg = {
            title: 'success',
            content: 'remove photo ' + name
        };

    db.Photo.find({_id: _id}, function (err, photo) {
        if (err) {
            console.log('query photo %s failed', name);
            status = 500;
            msg.title = 'failed';
        }
        db.Album.find({}).sort({sort: 1}).exec(function (err, albums) {
            if (err) {
                console.log('query albums failed');
                status = 500;
                msg.title = 'failed';
            }
            msg.photo = photo[0];
            msg.albums = albums.slice(1); // remove '全部' album
            res.status(status).send(msg);
        });
    });
});

router.post('/changePhotoInfo', function(req, res, next) {
    var _id = req.body._id,
        name = req.body.name,
        oldAlbums = req.body.oldAlbums,
        albums = req.body.albums;
    var status = 200,
        msg = {
            title: 'success',
            content: 'change photo ' + name
        };

    db.Photo.update({_id: _id}, {name: name, albums: albums}, function (err, raw) {
        if (err) {
            console.log('query photo %s failed', name);
            status = 500;
            msg.title = 'failed';
        }
        // album quantity update
        oldAlbums.split(/\s*,\s*/).forEach(function (item, index, arr) {
            db.Album.findOne({_id: item}, function (err, doc) {
                if (err) {
                    console.log('changePhotoInfo---update album quantity error');
                } else {
                    doc.quantity--;
                    doc.save();
                }
            });
        });

        albums.split(/\s*,\s*/).forEach(function (item, index, arr) {
            db.Album.findOne({_id: item}, function (err, doc) {
                if (err) {
                    console.log('changePhotoInfo---update album quantity error');
                } else {
                    doc.quantity++;
                    doc.save();
                }
            });
        });

        msg.raw = raw;
        res.status(status).send(msg);
    });
});

module.exports = router;