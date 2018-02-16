/**
 * @see https://stackoverflow.com/questions/16221005/determine-orientation-of-photos-in-javascript
 * @see https://jmperezperez.com/drawing-edges-svg/
 */

document.addEventListener('DOMContentLoaded', function(e) {
    let config,
        canvas,
        ctx;

    const init = () => {
        loadJSON('json?type=config').then(result => {
            config = result;
            canvas = document.getElementById('canvas');
            canvas.width = config.width;
            canvas.height = config.height;
            ctx = canvas.getContext('2d');
            document.getElementById('create-btn').addEventListener('click', createCollage);
            document.addEventListener('keyup', e => { e.keyCode === 39 ? createCollage() : null });
            createCollage();
        });
    };

    const createCollage = () => {
        const numImages = 3;
        loadJSON(`json?type=image&amount=${numImages}`).then(data => {
            console.log(data);
            Promise.all(data.map(loadImage)).then(images => {
                Promise.all(images.map(fixIPhoneRotation)).then(drawAll);
            });
        });
    };

    const loadImage = imageData => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `image?dir=${imageData.dir}&img=${imageData.image}`;
        });
    };
    
    const loadJSON = (url) => {
        return new Promise((resolve, reject) => {
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType('application/json');
            xobj.open('GET', url, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == '200') {
                    resolve(JSON.parse(xobj.responseText));
                }
            };
            xobj.send(null);  
        });
    };

    const fixIPhoneRotation = (img) => {
        return new Promise((resolve, reject) => {
            if (!img) {
                resolve(null);
            }
            EXIF.getData(img, function() {
                const make = EXIF.getTag(this, 'Make');
                if (make && make.indexOf('Apple') > -1 && EXIF.getTag(this, 'Orientation') === 6) {
                    console.log('fixIPhoneRotation', img.src);
                    const angle = Math.PI / 2;
            
                    const canvas = document.createElement('canvas');
                    canvas.width = img.height;
                    canvas.height = img.width;    
                    
                    const ctx = canvas.getContext('2d');
                    ctx.save();
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(angle);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();

                    const rotatedImage = new Image();
                    rotatedImage.src = canvas.toDataURL();
                    rotatedImage.onload = () => {
                        console.log('fixIPhoneRotation done');
                        resolve(rotatedImage);
                    };
                } else {
                    resolve(img);
                }
            });
        });
    };
    
    const drawAll = images => {
        for (let i = 0, n = images.length, num = 0; i < n; i++) {
            if (images[i]) {
                switch (num) {
                    case 0:
                        drawBackground(images[i]);
                        break;
                    case 1:
                        drawMidDistance(images[i]);
                        break;
                    case 2:
                        drawCloseDistance(images[i]);
                        break;
                }
                num++;
            }
        }
    };

    const drawBackground = img => {
        let sWidth = 100 + (Math.random() * (img.width - 100)),
            sHeight = (canvas.height / canvas.width) * sWidth,
            sx = Math.random() * (img.width - sWidth),
            sy = (img.height / 2) - (sHeight / 2),
            scale = Math.max(1, Math.max(canvas.width / sWidth, canvas.height / sHeight)),
            dWidth = sWidth * scale,
            dHeight = sHeight * scale,
            dx = Math.random() * (canvas.width - dWidth),
            dy = (canvas.height / 2) - (dHeight / 2);
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    };

    const drawMidDistance = img => {
        const clipWidth = (canvas.width * 0.2) + (Math.random() * (canvas.width * 0.6)),
            clipHeight = canvas.height,
            isLeft = !!Math.round(Math.random());
        
        createPath(clipWidth, clipHeight, isLeft, 0.7);
        ({sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = processImage(img, clipWidth, clipHeight, isLeft));
        ctx.save();
        ctx.clip();
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        ctx.restore();
        // ctx.lineWidth = 8;
        // ctx.strokeStyle = '#ff0000';
        // ctx.stroke();
    }
    
    const drawCloseDistance = img => {
        const clipWidth = (canvas.width * 0.2) + (Math.random() * (canvas.width * 0.5)),
            clipHeight = canvas.height,
            isLeft = !!Math.round(Math.random());
        
        createPath(clipWidth, clipHeight, isLeft, 0.9);
        ({sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = processImage(img, clipWidth, clipHeight, isLeft));
        ctx.save();
        ctx.clip();
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        ctx.restore();
        // ctx.lineWidth = 8;
        // ctx.strokeStyle = '#00ff00';
        // ctx.stroke();
    };


    const createPath = (clipWidth, clipHeight, isLeft, maxInset) => {
        const x = isLeft ? 0 : canvas.width - clipWidth,
            y = 0,
            w = clipWidth,
            h = canvas.height,
            hasMidPoint = Math.random() > 0.3,
            inSet = (Math.random() * maxInset) * clipWidth,
            topInset = Math.round(Math.random()) * inSet,
            midInset = Math.round(Math.random()) * inSet,
            btmInset = Math.round(Math.random()) * inSet,
            hasCurve = Math.random() > 0.7,
            hasCurve2 = Math.random() > 0.7;
        
        let x1, y1, x2, y2, x3, y3;
        
        ctx.beginPath();
        if (isLeft) {
            x1 = x + w - topInset;
            y1 = y;
            x2 = x + w - midInset;
            y2 = y + (h / 2);
            x3 = x + w - btmInset;
            y3 = y + h;
            ctx.lineTo(x1, y1);
            if (hasMidPoint) {
                if (hasCurve) {
                    createCurve(x1, y1, x2, y2);
                } else {
                    ctx.lineTo(x2, y2);
                }
                if (hasCurve2) {
                    createCurve(x2, y2, x3, y3);
                } else {
                    ctx.lineTo(x3, y3);
                }
            } else {
                if (hasCurve) {
                    createCurve(x1, y1, x3, y3);
                } else {
                    ctx.lineTo(x3, y3);
                }
            }
            ctx.lineTo(x, y + h);
            ctx.lineTo(x, y);
        } else {
            x1 = x + topInset;
            y1 = y;
            x2 = x + midInset;
            y2 = y + (h / 2);
            x3 = x + btmInset;
            y3 = y + h;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x3, y3);
            if (hasMidPoint) {
                if (hasCurve) {
                    createCurve(x3, y3, x2, y2);
                } else {
                    ctx.lineTo(x2, y2);
                }
                if (hasCurve) {
                    createCurve(x2, y2, x1, y1);
                } else {
                    ctx.lineTo(x1, y1);
                }
            } else {
                if (hasCurve) {
                    createCurve(x3, y3, x1, y1);
                } else {
                    ctx.lineTo(x1, y1);
                }
            }
        }
        ctx.closePath();
    };

    const processImage = (img, clipWidth, clipHeight, isLeft) => {
        const sWidth = 100 + Math.random() * (img.width - 100),
            sHeight = Math.min(sWidth, img.height),
            sx = Math.random() * (img.width - sWidth),
            sy = (img.height / 2) - (sHeight / 2),
            scale = Math.max(1, Math.max(clipWidth / sWidth, clipHeight / sHeight)),
            dWidth = sWidth * scale,
            dHeight = sHeight * scale,
            dx = isLeft ? 0 : canvas.width - clipWidth,
            dy = (canvas.height / 2) - (dHeight / 2);
        return {sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight};
    };

    const createCurve = (x1, y1, x2, y2) => {
        let cp1x, cp1y, cp2x, cp2y;
        const isConvex = Math.random() > 0.5,
            strength = 0.3 + (Math.random() * 0.5);
        if (isConvex) {
            cp1x = x1 + ((x2 - x1) * strength);
            cp1y = y1;
            cp2x = x2;
            cp2y = y2 - ((y2 - y1) * strength);
        } else {
            cp1x = x1;
            cp1y = y1 + ((y2 - y1) * strength);
            cp2x = x2 - ((x2 - x1) * strength);
            cp2y = y2;
        }
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    };
    
    init();
});
