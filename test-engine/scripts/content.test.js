const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// 기존 생성기의 실제 buildSection을 실행하며 파일 생성 부작용만 차단한다.
const source = fs.readFileSync(path.join(__dirname, 'generate-seo-content.js'), 'utf8').replace(/main\(\);\s*$/, '');
const ctx = { require, __dirname, console };
vm.createContext(ctx);
vm.runInContext(source + '\nthis.render = buildSection;', ctx);
const readConfig = folder => JSON.parse(fs.readFileSync(path.join(__dirname, '../tests', folder, 'config.json')));
const basic = { title: '테스트', description: '설명', scoring_type: 'sum', questions: [{text:'문항',choices:[{label:'답',score:1}]}], results: [{title:'유형',min:0,max:10}] };

test('실제 사이버펑크 플레이는 질문 노드 9개가 아니라 8문항이다', () => {
  const html = ctx.render(readConfig('56-mbti-cyberpunk-world'), '56-mbti-cyberpunk-world', []);
  assert.match(html, /<strong>8문항<\/strong>/);
  assert.doesNotMatch(html, /0문항|9문항/);
});
test('길이가 다른 분기는 최소~최대 실제 문항 수를 표시한다', () => {
  const cfg = {...basic, questions:undefined, start_node:'a', questions_tree:{a:{text:'시작', choices:[{}, {next:'b'}]}, b:{text:'끝',choices:[{}]}}};
  assert.match(ctx.render(cfg, 'branch', []), /<strong>1~2문항<\/strong>/);
});
test('순환과 잘못된 다음 문항을 정상 페이지로 발행하지 않는다', () => {
  for (const next of ['a','missing']) {
    const cfg = {...basic, questions:undefined, start_node:'a', questions_tree:{a:{choices:[{next}]}}};
    assert.throws(() => ctx.render(cfg, 'broken', []), /순환|문항/);
  }
});
test('겉과 속 두 결과를 한 가지 결과라고 설명하지 않는다', () => {
  const html = ctx.render(readConfig('11-real-vs-fake-mbti'), '11-real-vs-fake-mbti', []);
  assert.doesNotMatch(html, /결과는 <strong>16가지 유형<\/strong> 중 하나/);
});
test('검증되지 않은 고정 소요 시간을 자동으로 만들어 쓰지 않는다', () => {
  assert.doesNotMatch(ctx.render(basic,'basic',[]), /약 <strong>\d+분/);
});
test('고유 원고와 사례를 이스케이프하고 비어 있는 제목은 만들지 않는다', () => {
  const cfg = {...basic, editorial:{purpose:'고유 <script>설명</script>', method:'선택 점수의 합',interpretation:'의미와 한계',examples:[{title:'가상 사례',text:'A & B'}],faq:[]}};
  const html = ctx.render(cfg,'basic',[]);
  assert.match(html,/고유 &lt;script&gt;설명&lt;\/script&gt;/);
  assert.match(html,/A &amp; B/);
  assert.doesNotMatch(html,/<script>/);
});

test('실측 전에는 평균 시간 등 런타임 자리표시자를 공개 원고에 남기지 않는다', () => {
  const html=ctx.render(readConfig('39-decision-time-test'),'39-decision-time-test',[]);
  assert.doesNotMatch(html,/\{avgSec\}|\{[A-Za-z][A-Za-z0-9_]*\}/);
});
