// `new Date().toISOString()`이 라우트/스토어/Mock 클라이언트 곳곳에 산발적으로 반복되던 것을
// 한 곳으로 모은다. 테스트에서 시각을 주입하고 싶어지면 이 함수 하나만 바꾸면 된다
// (스케줄러의 checkTimeouts(now)처럼 인자로 시계를 받는 방식은 여기서는 필요할 때 확장).
function nowIso() {
  return new Date().toISOString();
}

module.exports = { nowIso };
