/**
 * 오늘의 운세 - 운세 생성 로직
 *
 * 핵심 원칙:
 * - 같은 사람 + 같은 날 = 항상 같은 결과
 * - 다음 날 = 다른 결과
 */

const Fortune = {
  /**
   * 간단한 해시 함수
   * 문자열을 일관된 숫자로 변환
   * @param {string} str - 해시할 문자열
   * @returns {number} - 양수 해시값
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  },

  /**
   * 시드 기반 배열 선택
   * @param {Array} array - 선택할 배열
   * @param {number} seed - 시드값
   * @param {number} offset - 오프셋 (같은 시드로 다른 결과)
   * @returns {*} - 선택된 요소
   */
  selectBySeed(array, seed, offset) {
    const index = (seed + offset * 7919) % array.length; // 7919는 소수
    return array[index];
  },

  /**
   * 행운의 시간 생성
   * @param {number} seed - 시드값
   * @returns {object} - { start: "HH:MM", end: "HH:MM", display: "HH:MM - HH:MM" }
   */
  generateLuckyTime(seed) {
    const startHour = (seed % 12) + 9; // 09:00 ~ 20:00
    const startMin = ((seed >> 4) % 12) * 5; // 0, 5, 10... 55
    const endHour = startHour + 2;
    const endMin = startMin;

    const formatTime = (h, m) =>
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    return {
      start: formatTime(startHour, startMin),
      end: formatTime(endHour, endMin),
      display: `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`
    };
  },

  /**
   * 행운의 번호 생성 (3개)
   * @param {number} seed - 시드값
   * @returns {array} - [num1, num2, num3]
   */
  generateLuckyNumbers(seed) {
    const numbers = [];
    const usedNumbers = new Set();

    for (let i = 0; i < 3; i++) {
      let num;
      let attempts = 0;
      do {
        num = ((seed >> (i * 5)) + i * 13) % 45 + 1; // 1 ~ 45
        attempts++;
        if (attempts > 10) {
          // 무한 루프 방지
          num = ((num + attempts) % 45) + 1;
        }
      } while (usedNumbers.has(num) && attempts < 50);

      usedNumbers.add(num);
      numbers.push(num);
    }

    return numbers.sort((a, b) => a - b);
  },

  /**
   * 오늘 날짜 문자열 생성
   * @returns {string} - YYYYMMDD
   */
  getTodayString() {
    const today = new Date();
    return today.getFullYear() +
           String(today.getMonth() + 1).padStart(2, '0') +
           String(today.getDate()).padStart(2, '0');
  },

  /**
   * 오늘 날짜 표시용 문자열
   * @returns {string} - "2026년 1월 28일 화요일"
   */
  getFormattedDate() {
    const today = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${days[today.getDay()]}`;
  },

  /**
   * 메인 운세 생성 함수
   * @param {string} name - 이름
   * @param {string} birthdate - 생년월일 (YYYY-MM-DD)
   * @returns {object} - 전체 운세 결과
   */
  generate(name, birthdate) {
    // 시드 생성: 이름 + 생년월일 + 오늘 날짜
    const todayStr = this.getTodayString();
    const seedString = name + birthdate.replace(/-/g, '') + todayStr;
    const seed = this.simpleHash(seedString);

    // 각 운세 요소 선택
    const overall = this.selectBySeed(fortuneData.overall, seed, 0);
    const money = this.selectBySeed(fortuneData.money, seed, 1);
    const love = this.selectBySeed(fortuneData.love, seed, 2);
    const color = this.selectBySeed(fortuneData.colors, seed, 3);
    const snack = this.selectBySeed(fortuneData.snacks, seed, 4);
    const advice = this.selectBySeed(fortuneData.advice, seed, 5);
    const caution = this.selectBySeed(fortuneData.caution, seed, 6);

    return {
      name: name,
      date: this.getFormattedDate(),

      // 총운
      overall: {
        score: overall.score,
        emoji: overall.emoji,
        title: overall.title,
        content: overall.content
      },

      // 금전운
      money: {
        emoji: money.emoji,
        title: money.title,
        content: money.content
      },

      // 연애운
      love: {
        emoji: love.emoji,
        title: love.title,
        content: love.content
      },

      // 행운 요소
      luckyTime: this.generateLuckyTime(seed),
      luckyColor: color,
      luckyNumbers: this.generateLuckyNumbers(seed),
      luckySnack: snack,

      // 한마디 & 주의사항
      advice: advice,
      caution: caution,

      // 메타데이터
      seed: seed,
      generatedAt: new Date().toISOString()
    };
  },

  /**
   * 공유용 텍스트 생성
   * @param {object} fortune - 운세 결과
   * @returns {string} - 공유 텍스트
   */
  generateShareText(fortune) {
    const scoreText = fortune.overall.score >= 80 ? '대박' :
                      fortune.overall.score >= 60 ? '좋은' : '평범한';

    return `🔮 오늘의 운세 결과!\n\n` +
           `${fortune.name}님의 오늘 운세는 ${scoreText} 운세! ${fortune.overall.emoji}\n` +
           `총운 ${fortune.overall.score}점\n\n` +
           `💰 금전운: ${fortune.money.title}\n` +
           `❤️ 연애운: ${fortune.love.title}\n` +
           `🎨 행운의 색: ${fortune.luckyColor.name}\n` +
           `🔢 행운의 번호: ${fortune.luckyNumbers.join(', ')}\n\n` +
           `💬 "${fortune.advice}"\n\n` +
           `나도 확인해보기 👉`;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Fortune;
}
