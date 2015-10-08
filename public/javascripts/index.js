$(function () {
// data maintenance
    window.imageManager = {
        albums: JSON.parse($('.hidden-info [name="albums"]').val()),
        images: JSON.parse($('.hidden-info [name="images"]').val())
    }
    // console.log(imageManager.albums);
    // console.log(imageManager.images);
});

$(function () {
// albums
    // album delete
    $('.aside .nav .icon.delete').on('click', albumDelete);
    // album edit
    $('.aside .nav .icon.edit').one('click', albumEdit);
    // new album
    $('.aside .operation button').on('click', newAlbum);

    function albumDelete() {
        if(confirm('确认删除吗？')) {
            var thisLi = $(this).parents('li');
            var _id = thisLi.attr('data-album-id').trim();
            var name = thisLi.find('.name').text().trim();
            $.ajax({
                url: '/ajax/deleteAlbum',
                method: 'POST',
                data: {
                    _id: _id,
                    name: name
                }
            }).done(function (msg) {
                if(msg.title === 'success') {
                    thisLi.remove();
                }
            });
        }
    }

    function albumEdit(e) {
        e.stopPropagation();

        var $this = $(this);
        var thisLi = $this.parents('li');
        var name = thisLi.find('.name').text().trim();
        thisLi.children().addClass('hide');
        thisLi.find('input').removeClass('hide')
            .select();

        $(document).on('click', renameClickHandler);
        thisLi.find('input').on('keydown', renameKeyHandler);
        function renameClickHandler(e) {
            if (e.target.nodeName !== 'LI' && thisLi.has(e.target).length === 0) {
                // console.log('click');
                changeAlbumName();
            }
        }
        function renameKeyHandler(e) {
            if (e.keyCode === 13) {
                // console.log('enter');
                changeAlbumName();
            }
        }
        function changeAlbumName() {
            var _id = thisLi.attr('data-album-id').trim();
            var newName = thisLi.find('input').val().trim();
            if (newName === name || !newName) {
                recover();
            } else {
                $.ajax({
                    url: '/ajax/renameAlbum',
                    method: 'POST',
                    data: {
                        _id: _id,
                        oldName: name,
                        newName: newName
                    }
                }).done(function (msg) {
                    if(msg.title === 'success') {
                        thisLi.find('.name').text(newName);
                        thisLi.find('input').val(newName);
                    }
                    recover();
                });
            }
        }
        function recover() {
            $(document).off('click', renameClickHandler);
            thisLi.find('input').off('keydown', renameKeyHandler);

            thisLi.children().removeClass('hide');
            thisLi.find('input').addClass('hide');

            $this.one('click', albumEdit);
        }
    }

    function newAlbum() {
        var name = '新建相册';
        var quantity = 0;
        $.ajax({
            url: '/ajax/addAlbum',
            method: 'POST',
            data: {
                name: name,
                quantity: quantity
            }
        }).done(function (msg) {
            // console.log(msg);
            if (msg.title === 'success') {
                var addLi = $('.aside .nav li').last().clone();
                addLi.attr('data-album-id', msg.album._id);
                addLi.find('.name').text(msg.album.name);
                addLi.find('.quantity').text('(' + msg.album.quantity + ')');
                addLi.find('input').val(msg.album.name);
                addLi.appendTo('.aside .nav ul');

                addLi.find('.icon.delete').on('click', albumDelete);
                addLi.find('.icon.edit').one('click', albumEdit)
                    .trigger('click');
            }
        });
    }
});

$(function () {
//photo operation
    // 初始化Web Uploader
    var uploader = WebUploader.create({
        // 选完文件后，是否自动上传。
        auto: true,
        // swf文件路径
        // swf: BASE_URL + '/js/Uploader.swf',
        // 文件接收服务端。
        server: '/ajax/addPhoto',
        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: '#imagePicker',
        // 只允许选择图片文件。
        accept: {
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });
    uploader.on('uploadSuccess', function (file, msg) {
        if (msg.title === 'success') {
            var photoSection = $('.main .images .photo-template').clone();
            photoSection.removeClass('hide photo-template').attr('data-image-id', msg.photo._id)
                .find('img').attr('src', msg.photo.src);
            photoSection.find('.info .name').text(msg.photo.name);

            photoSection.find('.op .delete').on('click', photoDelete);
            photoSection.find('img').on('dblclick', openPhotoViewer);

            $('.main .images').append(photoSection);
        }
    });

    // hover
    // $('.main .images .op').on('mouseover', function () {
    //     $(this).find('ul').removeClass('hide');
    // });
    // $('.main .images .op').on('mouseout', function () {
    //     $(this).find('ul').addClass('hide');
    // });

    // photo delete
    $('.main .images .op .delete').on('click', photoDelete);

    function photoDelete() {
        if(confirm('确认删除吗？')) {
            var thisSection = $(this).parents('section');
            var _id = thisSection.attr('data-image-id').trim();
            var name = thisSection.find('.name').text().trim();
            $.ajax({
                url: '/ajax/deletePhoto',
                method: 'POST',
                data: {
                    _id: _id,
                    name: name
                }
            }).done(function (msg) {
                if(msg.title === 'success') {
                    thisSection.remove();
                }
            });
        }
    }

    /*
    * photo viewer
    */
    $('.main .images > section img').on('dblclick', openPhotoViewer);
    $('.main .viewer .icon.close').on('click', closePhotoViewer);
    $('.main .viewer .icon.right').on('click', nextPhoto);
    $('.main .viewer .icon.left').on('click', prevPhoto);

    function openPhotoViewer() {
        var imgSrc = $(this).attr('src'),
            dataImageId = $(this).parents('section').attr('data-image-id');

        var $viewer = $('.main .viewer');
        $viewer.find('.image img').attr('src', imgSrc);
        $viewer.attr('data-image-id', dataImageId).removeClass('hide');
    }
    function closePhotoViewer() {
        $(this).parents('.viewer').addClass('hide');
    }
    function nextPhoto() {
        var $viewer = $(this).parents('.viewer');
        var dataImageId = $viewer.attr('data-image-id');
        var thisSection = $('.main .images section[data-image-id="' + dataImageId + '"]');
        var nextSection, nextDataImageId, nextImgSrc;
        if (thisSection.next().length) {
            nextSection = thisSection.next();
        } else {
            nextSection = thisSection.siblings('section').eq(1);
        }
        nextDataImageId = nextSection.attr('data-image-id');
        nextImgSrc = nextSection.find('img').attr('src');

        $viewer.attr('data-image-id', nextDataImageId)
            .find('.image img').attr('src', nextImgSrc);
    }
    function prevPhoto() {
        var $viewer = $(this).parents('.viewer');
        var dataImageId = $viewer.attr('data-image-id');
        var thisSection = $('.main .images section[data-image-id="' + dataImageId + '"]');
        var prevSection, prevDataImageId, prevImgSrc;
        if (thisSection.prev(':not(".photo-template")').length) {
            prevSection = thisSection.prev();
        } else {
            prevSection = thisSection.siblings('section').last();
        }
        prevDataImageId = prevSection.attr('data-image-id');
        prevImgSrc = prevSection.find('img').attr('src');

        $viewer.attr('data-image-id', prevDataImageId)
            .find('.image img').attr('src', prevImgSrc);
    }

    /*
    * photo operation
    */
    $('.main .images .op .edit').on('click', operationPhoto);
    $('.main .operation .icon.close').on('click', closeOperation);
    // $('.main .operation .icon.right').on('click', nextPhoto);
    // $('.main .operation .icon.left').on('click', prevPhoto);

    function operationPhoto() {
        var operation = $('.main .operation');
        operation.removeClass('hide');
    }
    function closeOperation() {
        $('.main .operation').addClass('hide');
    }

});
