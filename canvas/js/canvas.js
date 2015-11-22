!(function() {
    var eventType = "click";
    //上传图片相关的参数
    var params = {
        "div_height": 50, //底部"取消"和"选取"所在div的高度
        "sqrt": 1,
        "isScale": false //图片是否有放大/缩小过
    };
    //获取手机屏幕宽高
    var c_w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        c_h = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - params.div_height;
    var can_obj = document.querySelector("#canvas"),
        ctx_img = can_obj.getContext("2d");
    var pic = {
        init: function() {
            var me = this;
            me.setCanvasXY();
            me.bindEvent();
        },
        setCanvasXY: function() {
            //设置canvas 宽度（全屏显示），高度,上下居中显示
            can_obj.width = c_w - 2;
            can_obj.height = c_w - 2;
            can_obj.style.top = (c_h - c_w - 2) / 2 + "px";
        },
        bindEvent: function() {
            document.querySelector('.file').addEventListener('change', fileChange, false);
        },
        fixIOSBug: function(file, callback) {
            var imageReader = new FileReader();
            imageReader.readAsDataURL(file);
            imageReader.onload = function() {
                var el = document.querySelector("#canvas_img");
                //图片加载完成之后再执行回调函数
                el.onload = function() {
                    el.onload = null; //避免重复触发
                    EXIF.getData(el, function() {
                        var allTag = EXIF.getAllTags(el),
                            mpImg = new MegaPixImage(file),
                            tmpCanvas = document.createElement("canvas"),
                            tmpContext = tmpCanvas.getContext("2d");
                        tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height); //清除画布
                        var w = allTag.PixelXDimension,
                            h = allTag.PixelYDimension;
                        while (w >= 3264 || h >= 2448) {
                            w = (w * 0.5).toFixed(2);
                            h = (h * 0.5).toFixed(2);
                        }
                        mpImg.render(tmpCanvas, {
                            maxWidth: w || c_w,
                            maxHeight: h || c_h,
                            quality: 1,
                            orientation: allTag.Orientation || 1
                        });
                        var _timeout = setTimeout(function() {
                            clearTimeout(_timeout);
                            var base64 = tmpCanvas.toDataURL('image/jpeg', 1);
                            tmpCanvas = null;
                            tmpContext = null;
                            el.setAttribute('src', base64);
                            callback && callback(file, allTag);
                        }, 300); //等待前面的canvas绘制完成后再执行
                    });
                };
                el.src = this.result;
            };
        },
        uploadModule: function(file, allTag) {
            var div_obj = document.querySelector("#canvas_div"),
                img_obj = document.querySelector("#canvas_img");
            var orientation = allTag.Orientation || 1;
            var posX = 0,
                posY = 0; //相对坐标
            var scale = 0; //记录在缩放动作执行前的 缩放值
            var start_X1 = 0,
                start_Y1 = 0,
                start_X2 = 0,
                start_Y2 = 0;
            var start_sqrt = 0, //开始缩放比例
                sqrt = params.sqrt;
            var _x = 0,
                _y = 0;
            var left_x = 0,
                left_y = 0; //计算 偏移量 设置画布中的X，Y轴 (加偏移量)
            var distX = 0,
                distY = 0; //最后绘制canvas时候的X和Y值
            load();

            function load() {
                img_obj.onload = function() {
                    document.querySelector('#loading').style.display = 'none';
                    document.querySelector('#handleImage').style.display = 'block';
                    //在图片显示后，设置图片自适应大小及图片的居中显示
                    autoResizeImage(allTag);
                    img_obj.style.top = (c_h - img_obj.height - 2) / 2 + "px";
                    img_obj.style.left = (c_w - img_obj.width) / 2 + "px";
                    distX = (can_obj.width - img_obj.width) / 2;
                    distY = (can_obj.height - img_obj.height) / 2;
                };
                div_obj.addEventListener('touchstart', touch, false);
                div_obj.addEventListener('touchmove', touch, false);
                div_obj.addEventListener('touchend', touchend, false);

                function touchend(event) {
                    event.preventDefault(); //阻止浏览器或body 其他冒泡事件
                    if (!params.isScale && sqrt <= params.sqrt) {
                        sqrt = params.sqrt;
                        img_obj.style.left = "0px";
                        img_obj.style.webkitTransform = "scale(" + sqrt + ")"; //设置放大缩小
                        img_obj.style.Transform = "scale(" + sqrt + ")";
                        //图片离顶部的距离
                        var imgTopX = parseFloat(img_obj.style.top);
                        //canvas框离顶部的距离
                        var canTopX = parseFloat(can_obj.style.top);
                        //图片的高度
                        var imgHeight = img_obj.height;
                        //canvas框的高度
                        var canHeight = can_obj.height;
                        //如果图片比canvas框小，则始终居中显示
                        if (img_obj.height < can_obj.height) {
                            img_obj.style.top = (can_obj.height - img_obj.height) / 2 + canTopX + "px";
                        } else {
                            if (imgTopX > canTopX) {
                                img_obj.style.top = canTopX + "px";
                            }
                            if (imgTopX + imgHeight < canTopX + canHeight) {
                                img_obj.style.top = canTopX + canHeight - imgHeight + 1 + "px";
                            }
                        }
                        _x = 0;
                        _y = img_obj.offsetTop;
                        distX = _x + left_x / 2 - 1;
                        distY = _y - parseFloat(can_obj.style.top) + left_y / 2 - 1;
                    } else {
                        if (sqrt <= params.sqrt) { //如果是缩小
                            sqrt = params.sqrt;
                            img_obj.style.webkitTransform = "scale(" + sqrt + ")"; //设置放大缩小
                            img_obj.style.Transform = "scale(" + sqrt + ")";
                            img_obj.style.left = "0px";
                            _x = 0;
                            _y = img_obj.offsetTop;
                            left_x = 0;
                            left_y = 0;
                            distX = _x + left_x / 2 + h - 1;
                            distY = _y - parseFloat(can_obj.style.top) + left_y / 2 - 1;
                            params.isScale = false;
                        } else { // 如果是放大
                            var dImg_left = parseFloat(img_obj.style.left),
                                dImg_top = parseFloat(img_obj.style.top),
                                dCav_top = parseFloat(can_obj.style.top);
                            var w = img_obj.width,
                                h = img_obj.height,
                                sw = w * sqrt,
                                sh = h * sqrt;
                            left_x = w - sw; //计算 偏移量 设置画布中的X，Y轴 (加偏移量) 注：canvas 原点放大（canvas中图片左上角坐标），css3 scale 中点放大
                            left_y = h - sh;
                            var left_img = dImg_left + left_x / 2 - 1,
                                top_img = dImg_top + left_y / 2 - dCav_top - 1;
                            //如果左侧超出范围
                            if (left_img > 0) {
                                left_img = 0;
                                img_obj.style.left = Math.abs(left_x / 2) + "px";
                            }
                            //如果上面超出范围
                            if (top_img > 0) {
                                top_img = 0;
                                img_obj.style.top = Math.abs(left_y / 2) + dCav_top + "px";
                            }
                            //如果右侧超出范围
                            if (left_img + sw < can_obj.width) {
                                left_img = left_x;
                                img_obj.style.left = left_x / 2 + "px";
                            }
                            //如果下面超出范围
                            if (top_img + sh < can_obj.height) {
                                top_img = can_obj.height - sh;
                                img_obj.style.top = (c_h + can_obj.height - (sqrt + 1) * h) / 2 + "px";
                            }
                            distX = left_img;
                            distY = top_img;
                            params.isScale = false;
                        }
                    }
                }

                function touch(event) {
                    event.preventDefault(); //阻止浏览器或body 其他冒泡事件
                    var touchList = event.touches;
                    var mv_x1 = touchList[0].clientX,
                        mv_y1 = touchList[0].clientY; //手指坐标
                    var img_left = img_obj.left,
                        img_top = img_obj.top; //图片坐标
                    if (touchList.length == 1) { //单指操作
                        if (event.type == "touchstart") { //开始移动
                            posX = mv_x1 - img_obj.offsetLeft; //获取img相对坐标
                            posY = mv_y1 - img_obj.offsetTop;
                        } else if (event.type == "touchmove") { //移动中
                            _x = mv_x1 - posX; //移动坐标
                            _y = mv_y1 - posY;
                            img_obj.style.left = _x + "px";
                            img_obj.style.top = _y + "px";
                        }
                    } else if (touchList.length == 2) { //双指操作
                        if (event.type == "touchstart") {
                            scale = img_obj.style.Transform == undefined ? 1 : parseFloat(img_obj.style.Transform.replace(/[^0-9^\.]/g, "")); //获取在手指按下瞬间的放大缩小值（scale），作用，在移动时，记录上次移动的放大缩小值
                            start_X1 = touchList[0].clientX; //记录开始的坐标值,作用：在下次放大缩小后，去掉上次放大或缩小的值
                            start_Y1 = touchList[0].clientY;
                            start_X2 = touchList[1].clientX;
                            start_Y2 = touchList[1].clientY;
                            start_sqrt = Math.sqrt(Math.pow(start_X2 - start_X1, 2) + Math.pow(start_Y2 - start_Y1, 2)) / 200; //获取在缩放时 当前缩放的值
                        } else if (event.type == "touchmove") {
                            params.isScale = true;
                            var mv_x2 = touchList[1].clientX,
                                mv_y2 = touchList[1].clientY;
                            var move_sqrt = Math.sqrt(Math.pow(mv_x2 - mv_x1, 2) + Math.pow(mv_y2 - mv_y1, 2)) / 200; //动态获取上一次缩放值(随时变更)，在下次缩放时减去上一次的值，作用：防止累加之前的缩放
                            sqrt = move_sqrt - start_sqrt + scale; //求出缩放值
                            img_obj.style.webkitTransform = "scale(" + sqrt + ")"; //设置放大缩小
                            img_obj.style.Transform = "scale(" + sqrt + ")";
                        }
                    }
                }
            }
            //裁图
            document.querySelector('#save_img').addEventListener(eventType, function() {
                ctx_img.clearRect(0, 0, can_obj.width, can_obj.height); //清除画布
                ctx_img.drawImage(img_obj, distX, distY, img_obj.width * sqrt, img_obj.height * sqrt);
                var base64 = can_obj.toDataURL('image/png', 1);
                document.querySelectorAll('.headpic_preview img')[0].setAttribute('src', base64);
                initImg();
            }, false);
            document.querySelector('#cancel_img').addEventListener(eventType, initImg, false);

            function initImg() {
                fixUploadImgBug();
                var selector = document.querySelector('#handleImage');
                var canvasImg = document.querySelector('#canvas_img');
                params.isScale = false;
                sqrt = params.sqrt;
                ctx_img.clearRect(0, 0, can_obj.width, can_obj.height); //清除画布
                //删掉图片的长度和宽度，以免对下一次求图片长度/宽度的时候发生错误
                canvasImg.removeAttribute('height');
                canvasImg.removeAttribute('width');
                canvasImg.removeAttribute('style');
                selector.style.display = 'none';
            }
            //图片宽度始终与屏幕宽度相等
            function autoResizeImage(allTag) {
                var w = allTag.PixelXDimension || img_obj.width;
                var h = allTag.PixelYDimension || img_obj.height;
                // 超过这个值base64无法生成，在IOS上
                while (w >= 3264 || h >= 2448) {
                    w = (w * 0.5).toFixed(2);
                    h = (h * 0.5).toFixed(2);
                }
                //如果向左或者向右旋转了
                if (orientation <= 8 && orientation >= 5) {
                    img_obj.width = c_w;
                    img_obj.height = c_w * w / h;
                } else {
                    img_obj.width = c_w;
                    img_obj.height = c_w * h / w;
                }
            }
        }
    };
    //修复连续选择同一张图片后无反应的BUG
    //主要思路，先删除该节点，然后插入一个一模一样的节点，然后再绑定一次
    function fixUploadImgBug() {
        var selector = document.querySelector('.file');
        selector.removeEventListener('change', fileChange);
        selector.parentNode.removeChild(selector);
        document.querySelector('#upload').innerHTML = '<input class="file" type="file" name="imageurl" accept="image/*">' + document.querySelector('#upload').innerHTML;
        document.querySelector('.file').addEventListener('change', fileChange, false)
    }

    function fileChange() {
        var file = this.files[0];
        document.querySelector('#loading').style.display = 'block';
        pic.fixIOSBug(file, pic.uploadModule);
    }
    pic.init();
})();