/* v1.1.6 | 5-in-1 Dashboard SPA — scripts/generate-mbti-pages.js
   애드센스 "가치가 별로 없는 콘텐츠" 거절 대응 — GEO 6단계 확장 2탄(꿈해몽 사전 /kkum/ 패턴 재사용).
   SPA(#mbti) 안에만 있던 MBTI 16유형 해설을 진짜 URL을 가진 정적 페이지로 노출한다.
   기존 data.js의 mbtiResults(유형당 ~200자)만으로는 페이지가 얇아서, 유형별 개요/연애/직장/궁합
   해설(EXTRA 사전)을 이 스크립트 안에 직접 집필해 페이지당 1,000자 이상을 확보했다.

   생성물: /mbti/index.html (16유형 목록) + /mbti/{code}/index.html ×16 + sitemap-mbti.xml
   실행: node scripts/generate-mbti-pages.js
   data.js mbtiResults 또는 이 파일의 EXTRA 텍스트가 바뀌면 재실행할 것. */

const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://gwamol-lab.xyz';

global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8'));
const RESULTS = global.window.AppData.mbtiResults;

// ── 유형별 추가 해설 (이 파일에서 직접 집필/관리 — 톤: 사이트 공통의 가벼운 존댓말+팩폭) ──
const EXTRA = {
  INTJ: {
    overview: 'INTJ는 머릿속에 항상 설계도가 굴러가는 유형이에요. 어떤 모임에 가도 "이건 이렇게 하면 더 효율적일 텐데"가 자동으로 떠오르고, 실제로 그 계획이 대체로 맞아서 더 무섭습니다. 혼자 있는 시간이 배터리 충전 시간이라, 주말에 약속이 없으면 실망이 아니라 안도부터 하는 편이에요.',
    love: '연애에서도 갑자기 불타오르기보다는 "이 사람이 내 인생 설계에 들어올 수 있는가"를 조용히 오래 검토합니다. 대신 한번 마음을 정하면 놀랄 만큼 일관되고 성실한 파트너가 돼요. 다정한 말은 서툴러도 상대의 문제를 대신 해결해주는 걸로 사랑을 표현하는 타입.',
    work: '직장에서는 회의 시간에 말은 적게 하지만, 정작 프로젝트의 큰 그림은 이미 혼자 다 그려놓은 사람이에요. 비효율적인 절차와 형식적인 보고를 견디기 힘들어하고, 능력 없는 상사를 만나면 티가 안 나게(사실 티가 남) 답답해합니다.',
    best: 'ENFP · ENTP', clash: 'ESFJ'
  },
  INTP: {
    overview: 'INTP는 "그건 왜 그런 거지?"가 인생의 기본 질문인 유형이에요. 남들이 당연하게 넘기는 것도 한번 파고들기 시작하면 새벽 3시까지 위키피디아 토끼굴에 빠져 있습니다. 지식 자체가 재미라서, 써먹을 데 없는 정보를 세상에서 제일 많이 알고 있어요.',
    love: '연애에서는 마음이 있어도 표현 회로가 자주 끊깁니다. 좋아하는 사람 앞에서 갑자기 어제 본 다큐멘터리 얘기를 꺼내는 게 이 유형의 애정 표현이에요. 대신 상대의 생각을 진심으로 궁금해하고, 대화가 통하는 상대에게는 누구보다 오래 집중합니다.',
    work: '직장에서는 문제의 근본 원인을 찾아내는 데 탁월하지만, 마감과 서류 작업 앞에서 급격히 힘을 잃어요. "일단 되게 만드는 것"보다 "제대로 이해하는 것"이 먼저라, 몰입하면 대단한 결과물을 내지만 그 몰입 스위치가 언제 켜질지는 본인도 모릅니다.',
    best: 'ENTJ · ESTJ', clash: 'ESFJ'
  },
  ENTJ: {
    overview: 'ENTJ는 어디에 갖다 놔도 결국 리더를 맡게 되는 유형이에요. 본인이 나서고 싶어서라기보다, 답답한 걸 보고 있느니 직접 지휘하는 게 빠르기 때문입니다. 목표가 정해지면 달성까지의 경로를 즉시 역산하고, 그 과정에서 망설이는 사람들을 끌고 가는 추진력이 있어요.',
    love: '연애에서도 밀당 같은 비효율은 사절이에요. 마음에 들면 직진하고, 관계의 문제도 회피하지 않고 정면으로 대화하자고 합니다. 다만 상대의 고민에 공감보다 해결책부터 내놔서 "위로가 필요했던 건데…"라는 말을 종종 듣는 편.',
    work: '직장에서는 성과로 말하는 타입이에요. 회의를 주도하고, 일정을 쪼개고, 애매한 책임 소재를 정리하는 데 능합니다. 대신 기준이 높아서 본인에게도 남에게도 엄격하고, 무능한 프로세스를 참는 인내심은 거의 제로에 가까워요.',
    best: 'INTP · INFP', clash: 'ISFP'
  },
  ENTP: {
    overview: 'ENTP는 토론이 시작되면 눈이 반짝이는 유형이에요. 심지어 본인이 동의하는 주장이라도 반대편 논리가 궁금해서 일부러 반박해보는, 타고난 악마의 변호인입니다. 아이디어가 쉴 새 없이 샘솟지만, 그걸 끝까지 마무리하는 건 별개의 문제예요.',
    love: '연애에서는 유머와 티키타카가 무기예요. 상대를 웃기는 데 진심이고, 대화가 잘 통하는 사람에게 급속도로 빠집니다. 다만 관계가 안정기에 접어들어 "새로움"이 사라지면 지루함을 느끼기 쉬워서, 함께 계속 새로운 걸 시도하는 게 중요해요.',
    work: '직장에서는 브레인스토밍의 왕이에요. 남들이 막혔다고 포기한 지점에서 완전히 다른 각도의 해법을 던집니다. 대신 루틴한 반복 업무는 영혼이 빠져나가는 소리가 들릴 정도로 힘들어하고, 시작한 프로젝트 마무리는 J 동료의 도움이 필요할 때가 많아요.',
    best: 'INTJ · INFJ', clash: 'ISFJ'
  },
  INFJ: {
    overview: 'INFJ는 겉으로는 조용한데 속에는 자기만의 확고한 세계가 있는 유형이에요. 사람들의 감정과 분위기를 스캐너처럼 읽어내고, 말하지 않은 속마음까지 눈치채는 통찰이 있습니다. 그래서 정작 본인은 사람들 속에 있으면 빨리 방전되고, 집에 와서 혼자 하루를 복기해야 회복돼요.',
    love: '연애에서는 얕은 만남 여러 번보다 깊은 관계 하나를 원해요. 상대를 진심으로 이해하려 하고 헌신적이지만, 자기 속마음은 겹겹이 싸서 잘 안 보여줍니다. 오래 만나도 "아직 이 사람의 전부를 모르겠다"는 말을 듣는 신비주의 유형.',
    work: '직장에서는 팀의 갈등을 가장 먼저 감지하는 조기경보기예요. 의미 없는 일에는 동기부여가 안 되지만, 가치 있다고 믿는 일에는 조용히 엄청난 몰입을 보여줍니다. 다만 부탁을 거절 못 해 일이 쌓이다가 한계점에서 갑자기 "손절 버튼"을 누르는 게 유명해요.',
    best: 'ENTP · ENFP', clash: 'ESTP'
  },
  INFP: {
    overview: 'INFP는 겉은 잔잔한데 내면에는 우주 하나가 통째로 들어있는 유형이에요. 길 가다 본 강아지, 어제 들은 노래 가사 하나로도 몇 시간짜리 상상의 나래를 펼칩니다. 자기만의 가치관이 확고해서, 평소엔 순한데 그 선을 건드리면 의외로 누구보다 단호해져요.',
    love: '연애에서는 이상적인 사랑에 대한 기대치가 높은 로맨티스트예요. 상대의 사소한 말을 오래 기억하고 의미를 부여합니다. 서운한 게 있어도 말 못 하고 혼자 새벽에 소설을 쓰다가, 상대는 영문도 모른 채 차가워진 공기를 마주하게 되는 패턴을 조심해야 해요.',
    work: '직장에서는 자기가 의미를 느끼는 일과 아닌 일의 성과 차이가 극단적이에요. 좋아하는 일에는 밤새는 줄 모르고 파고들지만, 마음이 떠난 일은 몸만 출근해 있습니다. 경쟁과 압박보다는 자율성과 인정을 줄 때 최고의 결과물이 나오는 타입.',
    best: 'ENTJ · ENFJ', clash: 'ESTJ'
  },
  ENFJ: {
    overview: 'ENFJ는 타고난 분위기 메이커이자 남 챙기기 전문가예요. 모임에서 혼자 겉도는 사람을 그냥 못 지나치고, 어느새 그 사람이 웃으면서 대화에 끼어 있게 만듭니다. 사람들의 성장을 진심으로 기뻐하는 몇 안 되는 유형이라 주변에 따르는 사람이 많아요.',
    love: '연애에서는 상대에게 아낌없이 퍼주는 스타일이에요. 기념일, 상대의 취향, 지나가듯 한 말까지 다 기억하고 챙깁니다. 문제는 정작 자기가 힘든 건 말 안 하고 웃는다는 것 — "나한테는 왜 기대지 않아?"라는 말을 들어봤다면 정확합니다.',
    work: '직장에서는 팀워크를 실제로 굴러가게 만드는 윤활유예요. 갈등 중재, 신입 챙기기, 회식 자리 지정석까지 조직의 감정노동을 도맡습니다. 리더 자리에서도 강압보다 설득과 동기부여로 사람을 움직이는 데 능해요. 대신 모두를 만족시키려다 본인이 먼저 소진되는 걸 조심할 것.',
    best: 'INFP · ISFP', clash: 'ISTP'
  },
  ENFP: {
    overview: 'ENFP는 세상 모든 게 재밌어 보이는 에너지 발전소예요. 새로운 사람, 새로운 장소, 새로운 취미에 진심으로 설레고, 그 설렘을 주변에 전염시킵니다. 관심사가 3주 주기로 바뀌는 것 같지만, 사실 "사람과 가능성"이라는 큰 주제는 한 번도 바뀐 적이 없어요.',
    love: '연애 초반의 몰입도는 16유형 중 최상위권이에요. 상대의 모든 게 궁금하고, 표현도 아끼지 않습니다. 다만 감정의 파도가 커서 상대의 미지근한 반응에 혼자 서운해지기도 해요. 자유를 존중해주면서도 애정 표현은 확실한 상대를 만나면 최강의 커플이 됩니다.',
    work: '직장에서는 새 프로젝트 시작 단계에서 가장 빛나요. 아이디어와 추진 에너지, 사람을 모으는 힘이 있습니다. 반복 업무와 세부 정리는 쥐약이라, 마무리를 도와줄 파트너가 있으면 시너지가 폭발해요. 사무실 분위기가 얼어붙었을 때 그걸 녹이는 것도 대부분 이 유형입니다.',
    best: 'INTJ · INFJ', clash: 'ISTJ'
  },
  ISTJ: {
    overview: 'ISTJ는 "약속은 지키라고 있는 것"이 뼈에 새겨진 유형이에요. 화려하진 않지만 맡은 일은 반드시 해내고, 그 꾸준함이 쌓여 주변의 신뢰를 독차지합니다. 즉흥이라는 단어와는 거리가 멀어서, 여행을 가도 시간 단위 계획표가 이미 준비돼 있어요.',
    love: '연애에서는 말보다 행동으로 증명하는 타입이에요. 사랑한다는 말은 아끼지만 매일 같은 시간에 연락하고, 한 번 한 약속은 어기지 않습니다. 이벤트나 서프라이즈는 서툴러도, 10년이 지나도 한결같은 안정감을 주는 파트너예요.',
    work: '직장에서는 조직의 기둥 그 자체예요. 규정과 절차를 지키고, 데이터를 꼼꼼히 관리하고, 남들이 놓친 디테일을 잡아냅니다. 갑작스러운 변경과 "일단 해보자"식 진행을 가장 힘들어하니, 변화가 필요할 땐 근거와 함께 미리 공유해주는 게 좋아요.',
    best: 'ESFP · ESTP', clash: 'ENFP'
  },
  ISFJ: {
    overview: 'ISFJ는 조용히 모두를 챙기고 있는 수호자 유형이에요. 팀에 간식이 떨어지지 않는 것도, 아픈 친구에게 약이 도착하는 것도 대부분 이 유형의 작품입니다. 본인이 한 일을 굳이 티 내지 않아서, 사라지고 나서야 모두가 그 빈자리를 실감해요.',
    love: '연애에서는 상대의 일상을 세심하게 기억하고 챙기는 스타일이에요. 상대가 지나가듯 말한 불편함을 다음 만남에 이미 해결해놓습니다. 다만 서운함을 오래 참고 쌓아두는 편이라, 터지기 전에 조금씩 표현하는 연습이 관계를 더 오래가게 해요.',
    work: '직장에서는 실무의 최전선을 묵묵히 지키는 사람이에요. 꼼꼼함과 책임감, 동료를 돕는 태도까지 갖춰서 어느 팀에서든 환영받습니다. 문제는 거절을 못 해서 일이 몰린다는 것 — "이것 좀 해줄 수 있어?"에 반사적으로 "네"라고 답하기 전에 3초만 세어보세요.',
    best: 'ESTP · ESFP', clash: 'ENTP'
  },
  ESTJ: {
    overview: 'ESTJ는 어수선한 상황을 못 참고 정리해버리는 현실 관리자예요. 모임 날짜가 2주째 안 잡히면 결국 이 유형이 투표를 올립니다. 원칙과 효율을 중시하고, 말과 행동이 일치해서 리더로 세워놓으면 조직이 착착 굴러가요.',
    love: '연애에서도 애매한 관계, 밀당, 읽씹 같은 건 견디지 못해요. 만나면 만나는 거고 아니면 아닌 겁니다. 표현이 직설적이라 가끔 상대에게 상처를 줄 수 있지만, 뒤끝 없고 책임감 있는 태도만큼은 확실한 파트너예요.',
    work: '직장에서는 목표 설정, 일정 관리, 실행까지 삼박자를 갖춘 유형이에요. 애매하게 굴러가던 프로젝트도 이 유형이 잡으면 데드라인이 생기고 역할이 정해집니다. 다만 "원래 하던 방식"에 대한 신뢰가 강해서, 새로운 시도를 제안받으면 검증부터 요구하는 편이에요.',
    best: 'INTP · ISTP', clash: 'INFP'
  },
  ESFJ: {
    overview: 'ESFJ는 모두가 잘 지내는 게 인생 목표인 친화력 만렙 유형이에요. 동네 맛집 사장님과도 3분 만에 친구가 되고, 모임에서 누가 소외되는 꼴을 못 봅니다. 주변 사람들의 생일과 경조사를 달력 없이 기억하는 게 특기예요.',
    love: '연애에서는 다정하고 헌신적인 정석 로맨티스트예요. 상대의 가족과 친구들에게까지 잘하는 몇 안 되는 유형입니다. 대신 관계에 쏟은 만큼 돌아오지 않으면 크게 서운해하고, 그 서운함을 주변에 먼저 상담하는 습관은 조심하는 게 좋아요.',
    work: '직장에서는 분위기와 실무를 동시에 챙기는 만능형이에요. 협업이 필요한 자리에서 특히 빛나고, 조직의 대소사를 꿰고 있어 정보 허브 역할을 합니다. 비판적인 피드백을 개인적인 공격으로 받아들이기 쉬우니, 일과 나를 분리하는 연습이 커리어에 도움이 돼요.',
    best: 'ISTP · ISFP', clash: 'INTP'
  },
  ISTP: {
    overview: 'ISTP는 말수는 적은데 손은 뭐든 고치고 있는 유형이에요. 조립, 수리, 기계, 운동처럼 몸으로 익히는 것에 타고난 감각이 있습니다. 감정 소모를 극도로 싫어해서 갈등이 생기면 싸우는 대신 그냥 조용히 사라지는 쪽을 택해요.',
    love: '연애에서는 간섭 없는 편안한 관계를 원해요. 매일 몇 시간씩 통화하는 연애는 이 유형에게 형벌에 가깝습니다. 대신 함께 있을 때 억지로 꾸미지 않아도 되는 상대, 각자의 시간을 존중해주는 상대에게는 의외로 오래, 깊게 정착해요.',
    work: '직장에서는 위기 상황에서 가장 침착한 해결사예요. 남들이 당황할 때 혼자 원인을 찾아 이미 고치고 있습니다. 회의가 길어지는 것과 감정적인 논쟁을 제일 싫어하고, "그래서 결론이 뭔데?"가 입 밖으로 나오려는 걸 매번 참는 중이에요.',
    best: 'ESFJ · ESTJ', clash: 'ENFJ'
  },
  ISFP: {
    overview: 'ISFP는 조용한데 취향은 확고한 감성 장인이에요. 좋아하는 음악, 색, 공간에 대한 감각이 남다르고, 그걸 굳이 남에게 증명하려 하지 않습니다. 갈등을 싫어해서 웬만하면 맞춰주지만, 자기 취향과 페이스를 침범당하면 소리 없이 멀어져요.',
    love: '연애에서는 말로 하는 고백보다 함께 보내는 시간의 밀도로 사랑을 표현해요. 상대가 편안해하는 순간을 만들어주는 데 재능이 있습니다. 서운해도 말 안 하고 참다가 어느 날 갑자기 지쳐버릴 수 있으니, 상대가 물어봐 주기를 기다리지 말고 먼저 표현해보세요.',
    work: '직장에서는 심미적인 감각과 디테일이 필요한 일에서 빛나요. 경쟁적인 분위기보다 각자의 몫을 존중하는 팀에서 능력이 배가됩니다. 스포트라이트를 부담스러워해서 성과를 어필하는 데 약하니, 묵묵히 한 일들을 기록으로 남겨두는 게 좋아요.',
    best: 'ENFJ · ESFJ', clash: 'ENTJ'
  },
  ESTP: {
    overview: 'ESTP는 "일단 해보고 생각하자"가 기본값인 행동파예요. 위험을 감수하는 스릴을 즐기고, 순간 판단력과 눈치가 빨라서 어떤 상황에도 금방 적응합니다. 긴 이론 설명을 듣느니 직접 부딪혀서 배우는 게 백배 빠른 유형이에요.',
    love: '연애 시작의 순발력은 최강이에요. 관심 있는 상대에게 재고 따지지 않고 다가가고, 데이트도 즉흥적이고 화려하게 리드합니다. 다만 깊은 감정 대화가 필요한 순간에 농담으로 넘기려는 습관이 있어서, 진지한 얘기를 피하지 않는 게 장기 연애의 열쇠예요.',
    work: '직장에서는 현장형 에이스예요. 계획서 쓰는 것보다 발로 뛰어 성과를 만들어오고, 협상과 위기 대응에 특히 강합니다. 책상에 오래 앉아 있는 업무와 장기 플랜 관리가 약점이니, 디테일을 챙겨줄 동료와 짝을 이루면 완벽해져요.',
    best: 'ISFJ · ISTJ', clash: 'INFJ'
  },
  ESFP: {
    overview: 'ESFP는 존재 자체가 파티인 유형이에요. 이 유형이 들어오는 순간 조용하던 자리에 웃음이 돌기 시작합니다. 지금 이 순간을 즐기는 데 진심이고, 어제의 후회와 내일의 걱정에 오늘을 저당 잡히지 않아요.',
    love: '연애에서는 표현을 아끼지 않는 다정한 분위기 메이커예요. 함께 있으면 즐겁고, 상대의 기분을 띄워주는 데 천재적입니다. 다만 진지한 갈등 상황을 회피하고 싶어하는 경향이 있어서, 불편한 대화도 미루지 않고 하는 연습이 필요해요.',
    work: '직장에서는 사람을 상대하는 일에서 최고의 퍼포먼스를 내요. 고객 응대, 발표, 팀 분위기 관리까지 "대면" 이 들어가는 일은 다 잘합니다. 반복적인 서류 업무와 혼자 하는 장기 프로젝트는 에너지가 급속 방전되니, 중간중간 사람과 부딪히는 일을 섞는 게 좋아요.',
    best: 'ISTJ · ISFJ', clash: 'INTJ'
  }
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STYLE = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; }
    body { background:#0f172a; color:#e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif; line-height:1.7; }
    a { color:#c4b5fd; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .wrap { max-width:760px; margin:0 auto; padding:1.25rem 1.25rem 4rem; }
    header.site { display:flex; align-items:center; gap:.6rem; padding:1rem 0; border-bottom:1px solid #1e293b; margin-bottom:1.5rem; }
    header.site img { width:32px; height:32px; }
    header.site .name { font-weight:900; font-size:1.05rem; color:#f1f5f9; }
    .crumb { font-size:.8rem; color:#94a3b8; margin-bottom:1.25rem; }
    .crumb a { color:#94a3b8; }
    h1 { font-size:1.7rem; font-weight:900; color:#f8fafc; margin-bottom:.75rem; line-height:1.3; }
    h2 { font-size:1.2rem; font-weight:800; color:#f1f5f9; margin:2rem 0 .75rem; }
    p.lead { font-size:1.05rem; color:#a5b4fc; font-weight:600; margin-bottom:1rem; }
    p { margin-bottom:1rem; color:#cbd5e1; }
    ul.traits { margin:0 0 1rem 1.2rem; color:#cbd5e1; }
    ul.traits li { margin:.25rem 0; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin:1.25rem 0; }
    .meta-grid > div { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:.9rem 1rem; }
    .meta-grid .k { font-size:.75rem; color:#94a3b8; margin-bottom:.25rem; }
    .meta-grid .v { font-weight:700; color:#f1f5f9; font-size:.95rem; }
    .tipbox { background:#3b2f0b; border:1px solid #a16207; border-radius:12px; padding:.9rem 1rem; color:#fde68a; margin:1.25rem 0; }
    .cta { text-align:center; margin:2rem 0; }
    .cta a { display:inline-block; background:#7c3aed; color:#fff; font-weight:800; padding:.85rem 1.5rem; border-radius:999px; }
    .cta a:hover { background:#6d28d9; text-decoration:none; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
    @media(min-width:560px){ .grid { grid-template-columns:1fr 1fr 1fr 1fr; } }
    .grid-wide { display:grid; grid-template-columns:1fr; gap:.75rem; }
    @media(min-width:560px){ .grid-wide { grid-template-columns:1fr 1fr; } }
    .card { display:block; background:#1e293b; border:1px solid #334155; border-radius:14px; padding:.9rem 1rem; }
    .card:hover { border-color:#8b5cf6; text-decoration:none; }
    .card .t { font-weight:800; color:#f1f5f9; margin-bottom:.2rem; font-size:.95rem; }
    .card .s { font-size:.8rem; color:#94a3b8; }
    footer.site { margin-top:3rem; padding-top:1.5rem; border-top:1px solid #1e293b; font-size:.8rem; color:#94a3b8; }
    footer.site a { color:#94a3b8; }
`;

function pageShell({ title, description, canonicalPath, body }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <link rel="canonical" href="${ORIGIN}${canonicalPath}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="과몰입 연구소"/>
  <meta property="og:locale" content="ko_KR"/>
  <meta property="og:url" content="${ORIGIN}${canonicalPath}"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:image" content="${ORIGIN}/share-cards/og-default.jpg"/>
  <link rel="icon" type="image/png" href="/assets/brand/favicon-32.png"/>
  <meta name="google-adsense-account" content="ca-pub-4825324689294427"/>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4825324689294427" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-W05KHWP4WY"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-W05KHWP4WY');</script>
  <style>${STYLE}</style>
</head>
<body>
  <div class="wrap">
    <header class="site">
      <a href="/"><img src="/assets/brand/logo-icon-96.png" alt="과몰입 연구소" width="32" height="32"/></a>
      <a href="/" class="name">과몰입 연구소</a>
    </header>
${body}
    <footer class="site">
      <p>ⓒ 과몰입 연구소 · 본 콘텐츠는 오락 목적이며 전문적인 심리 검사를 대체하지 않습니다.</p>
      <p><a href="/">홈</a> · <a href="/#mbti">MBTI 테스트 하러 가기</a> · <a href="/kkum/">꿈해몽 사전</a></p>
    </footer>
  </div>
</body>
</html>`;
}

const CODES = Object.keys(RESULTS);
const outRoot = path.join(__dirname, '..', 'mbti');

function typeGridHTML(exceptCode) {
  return '<div class="grid">' + CODES.filter(c => c !== exceptCode).map(c => {
    const r = RESULTS[c];
    return `<a class="card" href="/mbti/${c.toLowerCase()}/"><div class="t">${r.emoji} ${c}</div><div class="s">${esc(r.title)}</div></a>`;
  }).join('') + '</div>';
}

// ── 유형별 상세 페이지 ──
CODES.forEach(code => {
  const r = RESULTS[code];
  const x = EXTRA[code];
  if (!x) { console.error('EXTRA 누락:', code); process.exit(1); }
  const strengths = r.strength.split(',').map(s => s.trim()).filter(Boolean);
  const challenges = r.challenge.split(',').map(s => s.trim()).filter(Boolean);

  const body = `
    <nav class="crumb"><a href="/">홈</a> › <a href="/mbti/">MBTI 유형 사전</a> › ${code}</nav>
    <h1>${r.emoji} ${code} — ${esc(r.title)}</h1>
    <p class="lead">${esc(r.desc)}</p>
    <div class="meta-grid">
      <div><div class="k">별명</div><div class="v">${esc(r.title)}</div></div>
      <div><div class="k">대표 인물</div><div class="v">${esc(r.famous)}</div></div>
      <div><div class="k">환상의 케미</div><div class="v">${esc(x.best)}</div></div>
      <div><div class="k">티격태격 주의</div><div class="v">${esc(x.clash)}</div></div>
    </div>
    <h2>${code}는 어떤 사람인가요?</h2>
    <p>${esc(x.overview)}</p>
    <h2>강점</h2>
    <ul class="traits">${strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <h2>이런 점은 조심하세요</h2>
    <ul class="traits">${challenges.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="tipbox">💡 ${esc(r.tip)}</div>
    <h2>연애할 때 ${code}</h2>
    <p>${esc(x.love)}</p>
    <h2>직장에서의 ${code}</h2>
    <p>${esc(x.work)}</p>
    <h2>재미로 보는 궁합</h2>
    <p>${code}와 특히 합이 잘 맞는다고 이야기되는 유형은 <strong>${esc(x.best)}</strong>, 처음엔 부딪히기 쉬운 유형은 <strong>${esc(x.clash)}</strong>예요. 물론 MBTI 궁합은 재미로 보는 것 — 실제 관계는 유형보다 서로를 이해하려는 노력이 결정합니다.</p>
    <div class="cta"><a href="/#mbti">🧠 내 MBTI 다시 확인하러 가기</a></div>
    <h2>MBTI 과몰입러를 위한 심화 테스트</h2>
    <div class="grid-wide">
      <a class="card" href="/test-engine/tests/11-real-vs-fake-mbti/"><div class="t">🎭 찐 MBTI vs 겉 MBTI</div><div class="s">겉으로 보이는 나와 속마음의 유형이 같을까?</div></a>
      <a class="card" href="/test-engine/tests/19-mbti-stat-window/"><div class="t">🎮 MBTI 스탯창</div><div class="s">내 성격을 게임 캐릭터 능력치로 시각화</div></a>
      <a class="card" href="/test-engine/tests/6-mbti-addiction-level/"><div class="t">🔎 MBTI 과몰입 등급 판정</div><div class="s">나 혹시 MBTI 얘기 너무 많이 하나?</div></a>
    </div>
    <h2>다른 유형 보러 가기</h2>
    ${typeGridHTML(code)}
`;
  const dir = path.join(outRoot, code.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageShell({
    title: `${code} 특징 총정리 — ${r.title} 성격·연애·직장·궁합 | 과몰입 연구소`,
    description: `${code}(${r.title}) 유형의 성격 특징, 강점과 약점, 연애 스타일, 직장에서의 모습, 잘 맞는 유형까지 한 페이지에 정리했어요.`,
    canonicalPath: `/mbti/${code.toLowerCase()}/`,
    body
  }));
});

// ── 목록 페이지 ──
const listBody = `
    <nav class="crumb"><a href="/">홈</a> › MBTI 유형 사전</nav>
    <h1>MBTI 16유형 사전</h1>
    <p class="lead">유형별 성격 특징 · 연애 스타일 · 직장 생활 · 재미로 보는 궁합까지 한 번에.</p>
    <p>MBTI는 에너지 방향(E/I), 인식 방식(S/N), 판단 기준(T/F), 생활 양식(J/P) 네 가지 축의 조합으로 성격을 16가지 유형으로 나누는 성격 분류예요. 아래에서 내 유형(혹은 궁금한 그 사람의 유형)을 골라 자세한 해설을 읽어보세요. 아직 내 유형을 모른다면 12문항 간단 모드 또는 24문항 정밀 모드 테스트로 먼저 확인할 수 있어요.</p>
    <div class="cta"><a href="/#mbti">🧠 MBTI 테스트 하러 가기 (무료)</a></div>
    <h2>16가지 유형</h2>
    <div class="grid-wide">${CODES.map(c => {
      const r = RESULTS[c];
      return `<a class="card" href="/mbti/${c.toLowerCase()}/"><div class="t">${r.emoji} ${c} — ${esc(r.title)}</div><div class="s">${esc(r.desc)}</div></a>`;
    }).join('\n')}</div>
`;
fs.mkdirSync(outRoot, { recursive: true });
fs.writeFileSync(path.join(outRoot, 'index.html'), pageShell({
  title: 'MBTI 16유형 사전 — 유형별 성격·연애·직장·궁합 총정리 | 과몰입 연구소',
  description: 'MBTI 16가지 유형 전체의 성격 특징, 강점·약점, 연애 스타일, 직장에서의 모습, 궁합을 유형별 페이지로 정리한 무료 사전.',
  canonicalPath: '/mbti/',
  body: listBody
}));

// ── sitemap-mbti.xml ──
const urls = ['/mbti/'].concat(CODES.map(c => `/mbti/${c.toLowerCase()}/`));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${ORIGIN}${u}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(__dirname, '..', 'sitemap-mbti.xml'), sitemap);

console.log('생성 완료: /mbti/ 목록 1 + 상세 ' + CODES.length + ' + sitemap-mbti.xml (' + urls.length + ' URLs)');
