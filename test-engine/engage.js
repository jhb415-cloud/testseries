/* test-engine engage.js v1 | 댓글 UI
   engine.js를 전혀 건드리지 않는 완전히 독립적인 파일 — MutationObserver로 인트로 화면의
   .te-choices-fixed(테스트 시작 버튼)가 렌더된 걸 감지해서 그 "다음"(버튼 아래)에 패널을 붙인다.
   engine.js의 init()/state에는 접근하지 않고, data-test-id 속성만 별도로 다시 읽는다.

   comments/comment_votes/comment_reports 테이블은 메인 사이트(app.js)가 이미 쓰고 있는 것을
   section:'testengine' 값으로 그대로 재사용(스키마 변경 없음). 로직은 app.js의
   renderComments/submitComment/voteComment/reportComment와 동일한 패턴을 이 파일 안에서
   독립적으로 재구현한 것(두 번들은 별도 페이지 로드라 함수를 공유할 수 없음).

   test-engine엔 로그인 UI가 없어 댓글은 전부 익명 처리 — 닉네임은 메인 사이트와 같은
   localStorage 키(app_anon_label)를 재사용해 "익명_XXXXX" 형식을 그대로 노출(같은 기기면
   메인 사이트에서 본 라벨과 동일하게 보임). rate-limit도 메인 사이트와 같은 키(comment_last_at)를
   재사용해 사이트 전체 공통 쿨다운으로 취급한다.

   반응 버튼(저장/소름돋/빵터짐/킹정)은 설계만 하고 구현을 보류함(2026-07-14) — 저장(save)
   버튼이 로그인 후 마이페이지 "스크랩 목록"에 실제로 연결돼야 하는 기능이라, 로그인이 없는
   지금 카운트만 다는 건 의미가 약하다는 판단. 설계 기록은
   /home/codespace/.claude/plans/distributed-sauteeing-babbage.md 및
   /home/codespace/.claude/plans/3-drifting-quilt.md 참고 — 재구현 시 여기서 이어서 할 것. */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://yovwvcjuadfieprvsooo.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3FwRc74wSyRIvYGRPwXaSg_HaKNxdFZ';
  var SUPABASE_SDK_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  // scripts/banned-words-ko.json이 진짜 소스 — app.js(COMMENT_BANNED_WORDS)와 이 배열을 둘 다
  // 수동으로 동기화 유지할 것(두 번들이 분리돼있어 공유 로더를 두지 않기로 함, 리스트가 작고
  // 정적이라 단순 복제가 더 실용적이라고 판단).
  var ENGAGE_BANNED_WORDS = ["씨발","시발","씨팔","시팔","씨1발","ㅆㅂ","ㅅㅂ","개새끼","개새기","개색기","새끼","새기","병신","븅신","ㅂㅅ","좆","좃","존나","졸라","지랄","ㅈㄹ","미친놈","미친년","또라이","닥쳐","꺼져","걸레","창녀","썅","느금","니미","니에미","애미","fuck","fucking","shit","bitch","asshole"];
  var ENGAGE_RATE_LIMIT_MS = 10000;

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function containsBannedWord(text) {
    var lower = String(text || '').toLowerCase();
    return ENGAGE_BANNED_WORDS.some(function (w) { return lower.indexOf(w.toLowerCase()) !== -1; });
  }

  function getAnonLabel() {
    var v = localStorage.getItem('app_anon_label');
    if (!v) {
      v = '익명_' + Math.floor(10000 + Math.random() * 90000);
      localStorage.setItem('app_anon_label', v);
    }
    return v;
  }

  function getTestId() {
    var script = document.querySelector('script[data-test-id]');
    return (script && script.getAttribute('data-test-id')) || '';
  }

  var _toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('te-engage-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'te-engage-toast';
      el.className = 'te-engage-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  /* ---------- Supabase 부트스트랩 ---------- */

  function loadSupabaseSdk(callback) {
    if (window.sb) { callback(); return; }
    if (document.getElementById('te-supabase-sdk')) {
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (window.sb) { clearInterval(iv); callback(); }
        else if (tries > 50) { clearInterval(iv); callback(new Error('sdk-load-timeout')); }
      }, 100);
      return;
    }
    var script = document.createElement('script');
    script.id = 'te-supabase-sdk';
    script.src = SUPABASE_SDK_SRC;
    script.onload = function () {
      try {
        window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        ensureAnonSession().then(function () { callback(); });
      } catch (e) { callback(e); }
    };
    script.onerror = function () { console.warn('[test-engine] Supabase SDK 로드 실패'); callback(new Error('sdk-load-failed')); };
    document.head.appendChild(script);
  }

  // 메인 사이트의 INITIAL_SESSION 이벤트 게이팅(해시 라우팅 경쟁 상태 회피용)은 test-engine엔
  // 해시 라우터가 없어 불필요 — 단순히 세션 있으면 그대로, 없으면 익명 로그인.
  function ensureAnonSession() {
    return window.sb.auth.getSession().then(function (res) {
      if (res.data && res.data.session) return res.data.session;
      return window.sb.auth.signInAnonymously().then(function (res2) {
        if (res2.error) { console.error('[test-engine] 익명 로그인 실패', res2.error); return null; }
        return res2.data.session;
      });
    }).catch(function (e) { console.error('[test-engine] 세션 확인 실패', e); return null; });
  }

  /* ---------- 마운트 ---------- */

  var _mounted = false;

  function initEngage() {
    var root = document.getElementById('test-engine-root');
    if (!root) return;
    if (tryMount()) return;
    var observer = new MutationObserver(function () {
      if (tryMount()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function tryMount() {
    if (_mounted) return true;
    var appEl = document.querySelector('#test-engine-root .te-app');
    var footerEl = appEl && appEl.querySelector('.te-choices-fixed');
    if (!appEl || !footerEl) return false;
    _mounted = true;
    mountEngagePanel(appEl);
    return true;
  }

  function mountEngagePanel(appEl) {
    var testId = getTestId();

    var panel = document.createElement('div');
    panel.className = 'te-engage-panel';
    panel.innerHTML =
      '<div class="te-engage-comment-head">💬 댓글</div>' +
      '<p class="te-engage-comment-hint">모든 댓글은 이 기기의 익명 닉네임으로 남겨져요</p>' +
      '<div class="te-engage-comment-form">' +
      '<input type="text" id="te-engage-hp" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;width:1px;height:1px" />' +
      '<input type="text" class="te-engage-comment-input" id="te-engage-comment-input" maxlength="300" placeholder="댓글을 남겨보세요..." />' +
      '<button type="button" class="te-engage-comment-submit" id="te-engage-comment-submit">등록</button>' +
      '</div>' +
      '<div class="te-engage-comment-list" id="te-engage-comment-list"><p class="te-engage-comment-empty">불러오는 중...</p></div>';
    appEl.appendChild(panel);

    document.getElementById('te-engage-comment-submit').addEventListener('click', function () { submitComment(testId); });
    document.getElementById('te-engage-comment-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitComment(testId);
    });

    loadSupabaseSdk(function (err) {
      if (err) { console.error('[test-engine] Supabase 초기화 실패', err); return; }
      renderComments(testId);
    });
  }

  /* ---------- 댓글 ---------- */

  function renderComments(testId) {
    var listEl = document.getElementById('te-engage-comment-list');
    if (!listEl || !window.sb) return;
    window.sb.from('comments').select('*').eq('section', 'testengine').eq('item_id', testId).order('created_at', { ascending: false }).limit(50)
      .then(function (res) {
        if (res.error) throw res.error;
        var rows = res.data || [];
        if (!rows.length) { listEl.innerHTML = '<p class="te-engage-comment-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>'; return; }
        return window.sb.auth.getSession().then(function (sres) {
          var userId = sres.data.session && sres.data.session.user && sres.data.session.user.id;
          var votesPromise = userId
            ? window.sb.from('comment_votes').select('comment_id,vote_type').eq('user_id', userId).in('comment_id', rows.map(function (r) { return r.id; }))
            : Promise.resolve({ data: [] });
          return votesPromise.then(function (votesRes) {
            var myVotes = {};
            (votesRes.data || []).forEach(function (v) { myVotes[v.comment_id] = v.vote_type; });
            listEl.innerHTML = rows.map(function (c) { return commentItemHtml(c, myVotes[c.id]); }).join('');
            Array.prototype.forEach.call(listEl.querySelectorAll('[data-vote]'), function (btn) {
              btn.addEventListener('click', function () {
                voteComment(parseInt(btn.getAttribute('data-id'), 10), btn.getAttribute('data-vote'), testId);
              });
            });
            Array.prototype.forEach.call(listEl.querySelectorAll('[data-report]'), function (btn) {
              btn.addEventListener('click', function () { reportComment(parseInt(btn.getAttribute('data-id'), 10), testId); });
            });
          });
        });
      }).catch(function (e) {
        console.error('[test-engine] 댓글 조회 실패', e);
        listEl.innerHTML = '<p class="te-engage-comment-empty">댓글을 불러오지 못했어요</p>';
      });
  }

  function commentItemHtml(c, myVote) {
    var dateStr = new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    var initial = escapeHtml((c.nickname || '?').charAt(0));
    return '<div class="te-engage-comment-item">' +
      '<div class="te-engage-comment-avatar">' + initial + '</div>' +
      '<div class="te-engage-comment-body">' +
      '<span class="name">' + escapeHtml(c.nickname) + '</span><span class="date">' + dateStr + '</span>' +
      '<p>' + escapeHtml(c.body) + '</p>' +
      '<div class="te-engage-comment-actions">' +
      '<button type="button" class="' + (myVote === 'like' ? 'is-active' : '') + '" data-vote="like" data-id="' + c.id + '">👍 ' + (c.likes || 0) + '</button>' +
      '<button type="button" class="' + (myVote === 'dislike' ? 'is-active' : '') + '" data-vote="dislike" data-id="' + c.id + '">👎 ' + (c.dislikes || 0) + '</button>' +
      '<button type="button" data-report="1" data-id="' + c.id + '">🚩 신고</button>' +
      '</div></div></div>';
  }

  function submitComment(testId) {
    var hp = document.getElementById('te-engage-hp');
    if (hp && hp.value) return; // 봇 허니팟
    var input = document.getElementById('te-engage-comment-input');
    if (!input) return;
    var body = input.value.trim();
    if (!body) { showToast('댓글을 입력해주세요!'); return; }
    if (body.length > 300) { showToast('댓글은 300자 이내로 작성해주세요'); return; }
    if (containsBannedWord(body)) { showToast('부적절한 표현이 포함되어 있어요'); return; }
    var lastAt = parseInt(localStorage.getItem('comment_last_at') || '0', 10);
    if (Date.now() - lastAt < ENGAGE_RATE_LIMIT_MS) { showToast('잠시 후 다시 시도해주세요'); return; }
    if (!window.sb) { showToast('댓글 기능을 사용할 수 없어요'); return; }
    ensureAnonSession().then(function (session) {
      if (!session) { showToast('댓글 등록에 실패했어요'); return null; }
      return window.sb.from('comments').insert({
        section: 'testengine', item_id: testId,
        is_anonymous: true, nickname: getAnonLabel(), avatar_url: null, body: body, level: null
      }).then(function (res) {
        if (res.error) throw res.error;
        input.value = '';
        localStorage.setItem('comment_last_at', String(Date.now()));
        showToast('댓글이 등록됐어요!');
        renderComments(testId);
      });
    }).catch(function (e) {
      console.error('[test-engine] 댓글 등록 실패', e);
      if (String((e && e.message) || '').indexOf('부적절') !== -1) showToast('부적절한 표현이 포함되어 있어요');
      else showToast('댓글 등록에 실패했어요');
    });
  }

  function voteComment(commentId, voteType, testId) {
    if (!window.sb) return;
    ensureAnonSession().then(function (session) {
      if (!session) return null;
      var userId = session.user.id;
      return window.sb.from('comment_votes').select('vote_type').eq('comment_id', commentId).eq('user_id', userId).maybeSingle()
        .then(function (res) {
          if (res.data && res.data.vote_type === voteType) {
            return window.sb.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', userId);
          } else if (res.data) {
            return window.sb.from('comment_votes').update({ vote_type: voteType }).eq('comment_id', commentId).eq('user_id', userId);
          }
          return window.sb.from('comment_votes').insert({ comment_id: commentId, vote_type: voteType });
        });
    }).then(function () { renderComments(testId); }).catch(function (e) { console.error('[test-engine] 투표 실패', e); });
  }

  function reportComment(commentId, testId) {
    if (!window.sb) return;
    if (!window.confirm('이 댓글을 신고하시겠어요?')) return;
    ensureAnonSession().then(function () {
      return window.sb.from('comment_reports').insert({ comment_id: commentId });
    }).then(function (res) {
      if (res && res.error) {
        if (res.error.code === '23505') { showToast('이미 신고한 댓글이에요'); return; }
        throw res.error;
      }
      showToast('신고가 접수됐어요');
      renderComments(testId);
    }).catch(function (e) { console.error('[test-engine] 신고 실패', e); showToast('신고에 실패했어요'); });
  }

  /* ---------- 부트 ---------- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngage);
  } else {
    initEngage();
  }
})();
