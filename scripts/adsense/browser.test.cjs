const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '../..');
let server, browser, base;
const errors = [];
before(async () => {
  server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    try {
      if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
      const ext=path.extname(file);
      res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[ext]||'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
});
after(async()=>{if(browser)await browser.close(); if(server)await new Promise(resolve=>server.close(resolve));});
async function pageFor(options={}) {
  const page=await browser.newPage({viewport:{width:360,height:800},...options});
  page.on('pageerror', e=>errors.push(e.message));
  await page.addInitScript(() => {
    // 외부 인증·공유 SDK만 대체한다. 앱 렌더링과 채점 코드는 실제 파일을 실행한다.
    window.Kakao = { init() {}, isInitialized: () => false };
    window.handleOAuthRedirectError = () => {};
  });
  // 미리보기는 실제 계정/댓글/통계/광고에 접근하지 않는다. 앱·엔진·이미지는 실제 로컬 파일이다.
  await page.route('**/*', route=> {
    const u=new URL(route.request().url());
    if(u.origin!==base || /supabase-client\.js$/.test(u.pathname)) return route.fulfill({status:200,contentType:'text/javascript',body:''});
    return route.continue();
  });
  return page;
}
async function screenshot(page, name) {
  if (!process.env.ADSENSE_REPORT_DIR) return;
  fs.mkdirSync(process.env.ADSENSE_REPORT_DIR,{recursive:true});
  await page.screenshot({path:path.join(process.env.ADSENSE_REPORT_DIR,name+'.png'),fullPage:false});
}
test('JS가 없어도 초기 로딩에 가리지 않고 전체 테스트로 이동할 수 있다',async()=>{
  const p=await pageFor({javaScriptEnabled:false});
  await p.goto(base);
  const link=p.locator('#site-intro a[href="/all/"]');
  await link.waitFor({state:'visible',timeout:1500});
  await link.click({timeout:1500});
  assert.match(p.url(),/\/all\/$/);
  await p.close();
});
test('정상 홈의 추천 카드는 실제 URL을 가진 링크이고 가짜 조회수를 표시하지 않는다',async()=>{
  const p=await pageFor(); await p.goto(base);
  await p.locator('#home-sections-container .home-poster').first().waitFor({timeout:7000});
  assert.equal(await p.locator('#home-sections-container a.home-poster').count()>0,true);
  assert.equal(await p.locator('#home-sections-container .home-lb-count').count(),0);
  assert.equal(await p.locator('#site-intro').isVisible(),false);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await screenshot(p,'home-mobile');
  await p.close();
});
test('설명 링크를 눌러도 테스트를 시작할 수 있고 결과·재시도가 정상이다',async()=>{
  const p=await pageFor(); await p.goto(base+'/test-engine/tests/mental-age/');
  await p.locator('#te-start-btn').waitFor();
  await p.locator('a[href="#test-guide"]').first().click({timeout:1500});
  assert.equal(await p.locator('#test-guide').isVisible(),true);
  await p.locator('#te-start-btn').click();
  for(let i=0;i<15;i++){await p.locator('[data-choice-index]').first().click(); await p.waitForTimeout(100);}
  await p.locator('.te-result-title').waitFor({timeout:6000});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await screenshot(p,'mental-age-result-mobile');
  const again=p.getByRole('button',{name:/다시/}).first(); await again.click();
  assert.equal((await p.locator('#te-start-btn').count())>0 || (await p.locator('[data-choice-index]').count())>0,true);
  await p.close();
});
test('앱 파일 로드 실패 때도 정적 탐색을 이용할 수 있다',async()=>{
  const p=await pageFor();
  await p.route('**/app.js*', r=>r.abort());
  await p.goto(base);
  await p.locator('#site-intro a[href="/all/"]').click();
  assert.match(p.url(),/\/all\/$/); await p.close();
});
test('설정 로드 실패 화면에 재시도와 전체 목록 링크가 있다',async()=>{
  const p=await pageFor();
  await p.route('**/config.json',r=>r.fulfill({status:503,body:'unavailable'}));
  await p.goto(base+'/test-engine/tests/mental-age/');
  await p.getByRole('button',{name:'다시 불러오기'}).waitFor();
  await p.locator('.te-error a[href="/all/"]').click();
  assert.match(p.url(),/\/all\/$/); await p.close();
});
test('홈 카드 새 탭 링크와 데스크톱 배치가 정상이다',async()=>{
  const p=await pageFor({viewport:{width:1440,height:1000}}); await p.goto(base);
  const card=p.locator('a.home-poster').first(); await card.waitFor();
  const expected=await card.getAttribute('href');
  const opened=p.context().waitForEvent('page'); await card.click({modifiers:['Control']});
  const tab=await opened; await tab.waitForLoadState('domcontentloaded');
  assert.equal(new URL(tab.url()).pathname,expected);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await screenshot(p,'home-desktop'); await tab.close(); await p.close();
});
test('두뇌 게임 직접 진입·15문항·결과·재시도와 기록 저장이 정상이다',async()=>{
  const p=await pageFor();
  await p.goto(base+'/#brain');
  const start=p.locator('button[onclick="brainSelectDifficulty(\'easy\')"]'); await start.waitFor();
  await p.getByText('결과는 어떻게 정해지나요?',{exact:true}).click();
  await start.click();
  for(let i=0;i<15;i++) await p.locator('button[onclick^="brainAnswer("]').first().click();
  await p.getByText('등급 범위에서 무작위로 정한 게임 숫자예요. 실제 뇌 나이나 IQ가 아닙니다.',{exact:true}).waitFor();
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await screenshot(p,'brain-result-mobile');
  const stored=await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('ranking')).map(k=>[k,localStorage[k]]));
  assert.ok(stored.some(([key,value])=>key==='ranking_brain' && JSON.parse(value).length>0));
  await p.getByRole('button',{name:'다시 측정하기',exact:true}).click(); await start.waitFor(); await p.close();
});
test('공개 테스트 59개의 기본 경로를 끝까지 플레이한다',{timeout:240000},async t=>{
  const dir=path.join(root,'test-engine/tests');
  const entries=fs.readdirSync(dir).filter(f=>fs.existsSync(path.join(dir,f,'config.json')))
    .map(folder=>({folder,cfg:JSON.parse(fs.readFileSync(path.join(dir,folder,'config.json')))})).filter(x=>!x.cfg.private);
  assert.equal(entries.length,59);
  let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(cursor<entries.length){
      const {folder,cfg}=entries[cursor++];
      const p=await pageFor();
      try {
        await p.goto(base+'/test-engine/tests/'+folder+'/');
        await p.locator('#te-start-btn').click();
        if(cfg.point_budget){
          for(let i=0;i<cfg.point_budget.pool;i++) await p.locator('[data-budget-inc]').first().click();
          await p.locator('#te-budget-confirm').click();
        }
        for(let steps=0;steps<45;steps++){
          const action=p.locator('#te-inter-next, #te-slider-confirm, [data-choice-index], #te-restart-btn').first();
          await action.waitFor({state:'visible',timeout:10000});
          if(await p.locator('#te-restart-btn').count()) break;
          await action.click();
        }
        await p.locator('#te-restart-btn').waitFor({timeout:10000});
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,folder+' 가로 넘침');
        const badImages=await p.locator('#test-engine-root img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));
        assert.deepEqual(badImages,[],folder+' 결과 이미지');
        if(['11-real-vs-fake-mbti','56-mbti-cyberpunk-world'].includes(folder)) await screenshot(p,folder+'-result');
      } catch(error) { throw new Error(folder+': '+error.message,{cause:error}); }
      finally{await p.close();}
    }
  }));
});
test('로컬 미리보기의 앱·엔진 실행 오류가 없다',()=>assert.deepEqual(errors,[]));
