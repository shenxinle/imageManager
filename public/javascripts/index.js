$(function () {
// data maintenance
    var extraData = JSON.parse($('.hidden-info [name="extraData"]').val());
    console.log(extraData);
    window.imageManager = {
        albumsMaxSort: extraData.albumsMaxSort,
        imagesMaxSort: extraData.imagesMaxSort,
        albumAll: {
            _id: extraData.albumAll._id,
            name: extraData.albumAll.name
        },
        thisAlbum: {
            _id: extraData.thisAlbum._id,
            name: extraData.thisAlbum.name
        }
    };
    console.log(imageManager);

    // 全局公用函数维护
    imageManager.func = {
        addPhoto: addPhoto,  // arguments: [photo Object]
        albumQuantityModify: albumQuantityModify
    }

    function addPhoto(photo) {
        var photoSection = $('.main .images .photo-template').clone();
        photoSection.removeClass('hide photo-template').attr('data-image-id', photo._id)
            .find('img').attr('src', photo.src);
        photoSection.find('.info .name').text(photo.name);

        $('.main .images').append(photoSection);
    }

    function albumQuantityModify(albumId, plus) {
        var $quantity = $('.aside .nav li[data-album-id="' + albumId + '"] .quantity');
        var quan = parseInt($quantity.text().replace(/\(|\)/g, '').trim());
        $quantity.text('(' + (plus ? ++quan : --quan) + ')');
    }

/*
** go to album
*/
    $('.aside .nav li').on('click', getAlbumContent);

    function getAlbumContent() {
        var thisLi = $(this);
        if (thisLi.hasClass('on')) {
            return;
        }
        var _id = thisLi.attr('data-album-id').trim();
        var name = thisLi.find('.name').text().trim();
        $.ajax({
            url: '/ajax/getAlbum',
            method: 'POST',
            data: {
                _id: _id,
                name: name
            }
        }).done(function (msg) {
            if(msg.title === 'success') {
                thisLi.addClass('on')
                    .siblings('li').removeClass('on');

                $('.main .images > section:not(".photo-template")').remove();
                for(var i = 0; i < msg.images.length; i++) {
                    imageManager.func.addPhoto(msg.images[i]);
                }

                imageManager.thisAlbum = {
                    _id: _id,
                    name: name
                };
                // location.hash = (imageManager.thisAlbum._id === imageManager.albumAll._id) ? '' : imageManager.thisAlbum._id;
            }
        });
    }

/*
** albums operation
*/
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
        var sort = imageManager.albumsMaxSort + 1;
        $.ajax({
            url: '/ajax/addAlbum',
            method: 'POST',
            data: {
                name: name,
                quantity: quantity,
                sort: sort
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

                addLi.on('click', getAlbumContent);
                addLi.find('.icon.delete').on('click', albumDelete);
                addLi.find('.icon.edit').one('click', albumEdit)
                    .trigger('click');

                imageManager.albumsMaxSort++;
            }
        });
    }

/*
** photo operation
*/
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
    uploader.on('uploadBeforeSend', function (block, data) {
        data.albumId = imageManager.thisAlbum._id;
        data.albumName = imageManager.thisAlbum.name;
        data.sort = imageManager.imagesMaxSort + 1;
    });
    uploader.on('uploadSuccess', function (file, msg) {
        if (msg.title === 'success') {
            imageManager.func.addPhoto(msg.photo);

            imageManager.func.albumQuantityModify(imageManager.thisAlbum._id, true);
            if (imageManager.thisAlbum._id !== imageManager.albumAll._id) {
                imageManager.func.albumQuantityModify(imageManager.albumAll._id, true);
            }

            imageManager.imagesMaxSort++;
        }
    });

    // hover
    // $('.main .images .op').on('mouseover', function () {
    //     $(this).find('ul').removeClass('hide');
    // });
    // $('.main .images .op').on('mouseout', function () {
    //     $(this).find('ul').addClass('hide');
    // });

    /*
    * photos event
    */
    $('.main .images').on('click', function (e) {
        var $section = $(e.target).parents('.main .images > section');
        if(!$section.length) {
            return;
        }
        // console.log(e);
        var $delete = $section.find('.op .delete');
        var $edit = $section.find('.op .edit');
        if ($delete.has(e.target).length || $delete[0] === e.target) {
            photoDelete($section);
        } else if ($edit.has(e.target).length || $edit[0] === e.target) {
            operationPhoto($section);
        }
        return;
    });
    $('.main .images').on('dblclick', function (e) {
        var $section = $(e.target).parents('.main .images > section');
        if(!$section.length) {
            return;
        }
        var $img = $section.find('img');
        if ($img.has(e.target).length || $img[0] === e.target) {
            openPhotoViewer($img);
        }
        return;
    });
    /*
    * photo viewer
    */
    $('.main .viewer .icon.close').on('click', closePhotoViewer);
    $('.main .viewer .icon.right').on('click', nextPhoto);
    $('.main .viewer .icon.left').on('click', prevPhoto);
    /*
    * photo operation
    */
    $('.main .operation .button button').on('click', submitOperation);
    $('.main .operation .icon.close').on('click', closeOperation);

    function photoDelete($section) {
        if(confirm('确认删除吗？')) {
            var thisSection = $section;
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

                    imageManager.func.albumQuantityModify(imageManager.albumAll._id, false);
                    msg.photo.albums.split(/\s*,\s*/).forEach(function (item, index, arr) {
                        imageManager.func.albumQuantityModify(item, false);
                        // console.log(arr);
                    });
                }
            });
        }
    }

    function openPhotoViewer($img) {
        var imgSrc = $img.attr('src'),
            dataImageId = $img.parents('section').attr('data-image-id');

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

    function operationPhoto($section) {
        var thisPhoto = {
            _id: $section.attr('data-image-id').trim(),
            name: $section.find('.info .name').text().trim(),
            src: $section.find('img').attr('src').trim()
        }
        $.ajax({
            url: 'ajax/getOperationPhotoInfo',
            method: 'POST',
            data: thisPhoto,
        }).done(function (msg) {
            if(msg.title === 'success') {
                var $operation = $('.main .operation');
                var $checkboxTemplate = $operation.find('p.template');
                $checkboxTemplate.siblings('p').remove();

                $operation.find('.image-inner img').attr('src', thisPhoto.src);
                $operation.find('.image-info input[name="name"]').val(thisPhoto.name);
                msg.albums.forEach(function (item, index, arr) {
                    var $albumItem = $checkboxTemplate.clone();

                    $albumItem.removeClass('template hide');
                    $albumItem.find('input[type="checkbox"]').val(item._id);
                    $albumItem.find('.album-name').text(item.name);
                    if (msg.photo.albums.search(item._id) !== -1) {
                        $albumItem.find('input[type="checkbox"]').prop('checked', true);
                    }

                    $albumItem.appendTo($checkboxTemplate.parent());
                });

                $operation.attr('data-image-id', thisPhoto._id)
                    .attr('data-name', thisPhoto.name)
                    .attr('data-image-albums', msg.photo.albums)
                    .removeClass('hide');
            }
        });
    }
    function submitOperation() {
        var $operation = $(this).parents('.main .operation');
        var thisPhoto = {
            _id: $operation.attr('data-image-id'),
            oldName: $operation.attr('data-name'),
            name: $operation.find('input[name="name"]').val(),
            oldAlbums: $operation.attr('data-image-albums'),
            albums: ''
        };
        var albumsArr = [];
        $operation.find('.category-inner p:not(".template") input[type="checkbox"]').each(function (index, elem) {
            var $elem = $(elem);
            if($elem.prop('checked')) {
                albumsArr.push($elem.val().trim());
            }
        });
        thisPhoto.albums = albumsArr.join(',');

        if (thisPhoto.oldName === thisPhoto.name && thisPhoto.oldAlbums === thisPhoto.albums) {
            return;
        }

        $.ajax({
            url: 'ajax/changePhotoInfo',
            method: 'POST',
            data: thisPhoto
        }).done(function (msg) {
            if(msg.title === 'success') {
                // photo remove, rename
                if (thisPhoto.albums.search(imageManager.thisAlbum._id) !== -1 || imageManager.thisAlbum.name === '全部') {
                    // rename
                    if(thisPhoto.name !== thisPhoto.oldName) {
                        $('.main .images > section[data-image-id="' + thisPhoto._id + '"] .name').text(thisPhoto.name);
                    }
                } else {
                    // remove
                    $('.main .images > section[data-image-id="' + thisPhoto._id + '"]').remove();
                }

                // album quantity update
                thisPhoto.oldAlbums.split(/\s*,\s*/).forEach(function (item, index, arr) {
                    imageManager.func.albumQuantityModify(item, false);
                });
                thisPhoto.albums.split(/\s*,\s*/).forEach(function (item, index, arr) {
                    imageManager.func.albumQuantityModify(item, true);
                });

                closeOperation();
            }
        });
    }
    function closeOperation() {
        $('.main .operation').addClass('hide');
    }

});
