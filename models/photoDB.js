var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/image_manager');

// db connect log
var db = mongoose.connection;
db.on('error', function () {
    console.log('db connection error.');
});
db.once('open', function () {
    console.log('db connectted.');
});

// albums collection
var AlbumSchema = mongoose.Schema({
    name: String,
    quantity: Number
}, {
    collection: 'albums'
});
var Album = mongoose.model('Album', AlbumSchema);

// photos collection
var PhotoSchema = mongoose.Schema({
    name: String,
    src: String
}, {
    collection: 'photos'
});
var Photo = mongoose.model('Photo', PhotoSchema);

module.exports = {
    Album: Album,
    Photo: Photo
};