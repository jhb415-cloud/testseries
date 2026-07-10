/* test-engine v2 (STEP 2) | result-card.js — 결과 공유용 세로형 카드(Canvas) 합성 + 저장
   순수 바닐라 JS. 결과 이미지 + 타이틀 + 특징 요약 + 하단 워터마크를 하나의 PNG로 합성한다.
   engine.js가 결과 화면의 "이미지 저장" 버튼 클릭 시 window.TestEngineResultCard.renderCard()를 호출한다. */

(function () {
  'use strict';

  var CARD_W = 540;
  var CARD_H = 675;
  var SCALE = 2;

  var COLORS = {
    bg: '#FCEFD9',
    bandBg: '#085041',
    bandText: '#FFFFFF',
    title: '#085041',
    subtitle: '#4B6358',
    trait: '#2E4038',
    traitDot: '#D85A30',
    tipBg: 'rgba(29, 158, 117, 0.14)',
    tipText: '#085041',
    watermark: '#9AA79F',
  };

  var FONT_FAMILY = '-apple-system, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

  // 공백 기준으로 우선 줄바꿈하고, 그래도 폭을 넘는 덩어리(공백 없는 긴 한글 등)는 문자 단위로 재분할
  function wrapText(ctx, text, maxWidth) {
    var words = String(text).split(' ');
    var lines = [];
    var current = '';
    words.forEach(function (word) {
      var test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);

    var finalLines = [];
    lines.forEach(function (line) {
      if (ctx.measureText(line).width <= maxWidth) {
        finalLines.push(line);
        return;
      }
      var chunk = '';
      for (var i = 0; i < line.length; i++) {
        var test2 = chunk + line[i];
        if (ctx.measureText(test2).width > maxWidth && chunk) {
          finalLines.push(chunk);
          chunk = line[i];
        } else {
          chunk = test2;
        }
      }
      if (chunk) finalLines.push(chunk);
    });
    return finalLines;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('이미지 로드 실패: ' + src)); };
      img.src = src;
    });
  }

  // cover-fit으로 둥근 모서리 사각형 안에 이미지를 그림
  function drawRoundedImageCover(ctx, img, x, y, size, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + size, y, x + size, y + size, radius);
    ctx.arcTo(x + size, y + size, x, y + size, radius);
    ctx.arcTo(x, y + size, x, y, radius);
    ctx.arcTo(x, y, x + size, y, radius);
    ctx.closePath();
    ctx.clip();
    var scale = Math.max(size / img.width, size / img.height);
    var dw = img.width * scale;
    var dh = img.height * scale;
    var dx = x + (size - dw) / 2;
    var dy = y + (size - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function renderCard(config, result) {
    var canvas = document.createElement('canvas');
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    var ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = COLORS.bandBg;
    ctx.fillRect(0, 0, CARD_W, 78);
    ctx.fillStyle = COLORS.bandText;
    ctx.font = '700 22px ' + FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(config.title, CARD_W / 2, 48);

    var imgSize = 300;
    var imgX = (CARD_W - imgSize) / 2;
    var imgY = 100;
    try {
      var img = await loadImage(result.image);
      drawRoundedImageCover(ctx, img, imgX, imgY, imgSize, 24);
    } catch (e) {
      console.warn('[result-card] 결과 이미지를 그리지 못했습니다:', e.message);
    }

    var y = imgY + imgSize + 50;

    ctx.fillStyle = COLORS.title;
    ctx.font = '800 38px ' + FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText(result.title, CARD_W / 2, y);
    y += 34;

    if (result.subtitle) {
      ctx.fillStyle = COLORS.subtitle;
      ctx.font = '400 18px ' + FONT_FAMILY;
      ctx.textAlign = 'center';
      wrapText(ctx, result.subtitle, CARD_W - 80).forEach(function (line) {
        ctx.fillText(line, CARD_W / 2, y);
        y += 24;
      });
      y += 10;
    }

    if (result.traits && result.traits.length) {
      var blockX = 70;
      var blockWidth = CARD_W - blockX * 2;
      ctx.textAlign = 'left';
      ctx.font = '600 17px ' + FONT_FAMILY;
      result.traits.forEach(function (trait) {
        ctx.fillStyle = COLORS.traitDot;
        ctx.beginPath();
        ctx.arc(blockX + 5, y - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.trait;
        var lines = wrapText(ctx, trait, blockWidth - 24);
        lines.forEach(function (line, i) {
          ctx.fillText(line, blockX + 20, y);
          if (i < lines.length - 1) y += 22;
        });
        y += 30;
      });
      y += 6;
    }

    if (result.tip) {
      ctx.font = '400 15px ' + FONT_FAMILY;
      var tipLines = wrapText(ctx, result.tip, CARD_W - 120);
      var tipBoxH = tipLines.length * 22 + 24;
      var tipBoxY = y;
      var tx = 50;
      var tw = CARD_W - 100;
      ctx.fillStyle = COLORS.tipBg;
      drawRoundedRect(ctx, tx, tipBoxY, tw, tipBoxH, 14);
      ctx.fill();

      ctx.fillStyle = COLORS.tipText;
      ctx.textAlign = 'center';
      var ty = tipBoxY + 26;
      tipLines.forEach(function (line) {
        ctx.fillText(line, CARD_W / 2, ty);
        ty += 22;
      });
    }

    ctx.fillStyle = COLORS.watermark;
    ctx.font = '400 14px ' + FONT_FAMILY;
    ctx.textAlign = 'center';
    ctx.fillText('gwamol-lab.xyz', CARD_W / 2, CARD_H - 24);

    return canvas;
  }

  function saveCanvasAsImage(canvas, filenamePrefix) {
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = (filenamePrefix || 'result') + '-' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.TestEngineResultCard = {
    renderCard: renderCard,
    saveCanvasAsImage: saveCanvasAsImage,
  };
})();
