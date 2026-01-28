/**
 * 오늘의 운세 - 메인 앱 로직
 */

const App = {
  // 상태
  state: {
    currentScreen: 'main',
    fortune: null,
    streak: 0,
    visitCount: 0
  },

  // DOM 요소 캐시
  elements: {},

  /**
   * 앱 초기화
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSavedData();
    this.updateVisitorCount();
    this.setMaxBirthDate();
    this.initScrollProgress();
    this.registerServiceWorker();
  },

  /**
   * DOM 요소 캐시
   */
  cacheElements() {
    this.elements = {
      // 화면
      screenMain: document.getElementById('screen-main'),
      screenLoading: document.getElementById('screen-loading'),
      screenResult: document.getElementById('screen-result'),

      // 폼
      fortuneForm: document.getElementById('fortune-form'),
      nameInput: document.getElementById('name-input'),
      birthInput: document.getElementById('birth-input'),
      nameError: document.getElementById('name-error'),
      birthError: document.getElementById('birth-error'),

      // 로딩
      loadingText: document.getElementById('loading-text'),
      progressFill: document.getElementById('progress-fill'),

      // 결과
      resultName: document.getElementById('result-name'),
      resultDate: document.getElementById('result-date'),
      overallScore: document.getElementById('overall-score'),
      overallEmoji: document.getElementById('overall-emoji'),
      overallTitle: document.getElementById('overall-title'),
      overallContent: document.getElementById('overall-content'),
      moneyEmoji: document.getElementById('money-emoji'),
      moneyTitle: document.getElementById('money-title'),
      moneyContent: document.getElementById('money-content'),
      loveEmoji: document.getElementById('love-emoji'),
      loveTitle: document.getElementById('love-title'),
      loveContent: document.getElementById('love-content'),
      luckyTime: document.getElementById('lucky-time'),
      luckyColor: document.getElementById('lucky-color'),
      luckyColorDot: document.getElementById('lucky-color-dot'),
      luckyNumbers: document.getElementById('lucky-numbers'),
      luckySnack: document.getElementById('lucky-snack'),
      adviceContent: document.getElementById('advice-content'),
      cautionContent: document.getElementById('caution-content'),

      // 공유 & 기타
      shareKakao: document.getElementById('share-kakao'),
      shareUrl: document.getElementById('share-url'),
      retryBtn: document.getElementById('retry-btn'),
      streakBadge: document.getElementById('streak-badge'),
      streakIcon: document.getElementById('streak-icon'),
      streakText: document.getElementById('streak-text'),
      visitorCount: document.getElementById('visitor-count'),
      scrollProgress: document.getElementById('scroll-progress'),
      toast: document.getElementById('toast')
    };
  },

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 폼 제출
    this.elements.fortuneForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // 공유 버튼
    this.elements.shareKakao.addEventListener('click', () => this.shareKakao());
    this.elements.shareUrl.addEventListener('click', () => this.shareUrl());

    // 다시보기
    this.elements.retryBtn.addEventListener('click', () => this.showScreen('main'));

    // 입력 필드 에러 초기화
    this.elements.nameInput.addEventListener('input', () => {
      this.elements.nameInput.classList.remove('error');
      this.elements.nameError.textContent = '';
    });

    this.elements.birthInput.addEventListener('change', () => {
      this.elements.birthInput.classList.remove('error');
      this.elements.birthError.textContent = '';
    });
  },

  /**
   * 저장된 데이터 로드
   */
  loadSavedData() {
    // 마지막 입력 정보
    const savedName = localStorage.getItem('fortune_name');
    const savedBirth = localStorage.getItem('fortune_birth');

    if (savedName) this.elements.nameInput.value = savedName;
    if (savedBirth) this.elements.birthInput.value = savedBirth;

    // 연속 방문 계산
    this.calculateStreak();
  },

  /**
   * 연속 방문 계산
   */
  calculateStreak() {
    const today = Fortune.getTodayString();
    const lastVisit = localStorage.getItem('fortune_last_visit');
    let streak = parseInt(localStorage.getItem('fortune_streak') || '0');

    if (!lastVisit) {
      // 첫 방문
      streak = 1;
    } else {
      const lastDate = new Date(
        parseInt(lastVisit.slice(0, 4)),
        parseInt(lastVisit.slice(4, 6)) - 1,
        parseInt(lastVisit.slice(6, 8))
      );
      const todayDate = new Date(
        parseInt(today.slice(0, 4)),
        parseInt(today.slice(4, 6)) - 1,
        parseInt(today.slice(6, 8))
      );

      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // 오늘 이미 방문 - 스트릭 유지
      } else if (diffDays === 1) {
        // 어제 방문 - 스트릭 증가
        streak++;
      } else {
        // 연속 방문 끊김
        streak = 1;
      }
    }

    this.state.streak = streak;
    localStorage.setItem('fortune_streak', streak.toString());
    localStorage.setItem('fortune_last_visit', today);
  },

  /**
   * 방문자 카운터 업데이트 (시뮬레이션)
   */
  updateVisitorCount() {
    const now = new Date();
    const hours = now.getHours();

    // 시간대별 기본 방문자
    let baseCount = 5000;
    if (hours >= 7 && hours < 10) baseCount = 8000;  // 아침
    else if (hours >= 10 && hours < 12) baseCount = 12000;  // 오전
    else if (hours >= 12 && hours < 14) baseCount = 15000;  // 점심
    else if (hours >= 14 && hours < 18) baseCount = 18000;  // 오후
    else if (hours >= 18 && hours < 22) baseCount = 20000;  // 저녁
    else if (hours >= 22) baseCount = 10000;  // 밤

    // 랜덤 변동
    const randomVariation = Math.floor(Math.random() * 3000) - 1500;
    const count = baseCount + randomVariation;

    // 숫자 애니메이션
    this.animateNumber(this.elements.visitorCount, 0, count, 1500);
  },

  /**
   * 숫자 카운트업 애니메이션
   */
  animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = Math.floor(start + (end - start) * easeProgress);
      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  },

  /**
   * 생년월일 최대값 설정 (오늘)
   */
  setMaxBirthDate() {
    const today = new Date().toISOString().split('T')[0];
    this.elements.birthInput.max = today;

    // 최소값 (100년 전)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    this.elements.birthInput.min = minDate.toISOString().split('T')[0];
  },

  /**
   * 폼 제출 처리
   */
  handleSubmit() {
    const name = this.elements.nameInput.value.trim();
    const birth = this.elements.birthInput.value;

    // 유효성 검사
    let isValid = true;

    if (!name) {
      this.elements.nameInput.classList.add('error');
      this.elements.nameError.textContent = '이름을 입력해주세요';
      isValid = false;
    }

    if (!birth) {
      this.elements.birthInput.classList.add('error');
      this.elements.birthError.textContent = '생년월일을 선택해주세요';
      isValid = false;
    }

    if (!isValid) return;

    // 데이터 저장
    localStorage.setItem('fortune_name', name);
    localStorage.setItem('fortune_birth', birth);

    // 운세 생성
    this.state.fortune = Fortune.generate(name, birth);

    // 로딩 화면으로 이동
    this.showLoadingScreen();
  },

  /**
   * 화면 전환
   */
  showScreen(screenName) {
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // 해당 화면 보이기
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.state.currentScreen = screenName;

      // 스크롤 초기화
      window.scrollTo(0, 0);
    }
  },

  /**
   * 로딩 화면 표시
   */
  showLoadingScreen() {
    this.showScreen('loading');

    const loadingTexts = [
      '오늘의 운세를 불러오는 중...',
      '별자리를 분석하는 중...',
      '운명의 흐름을 읽는 중...',
      '행운의 기운을 계산하는 중...',
      '결과를 준비하는 중...'
    ];

    let textIndex = 0;
    let progress = 0;

    // 텍스트 변경 인터벌
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      this.elements.loadingText.textContent = loadingTexts[textIndex];
    }, 500);

    // 프로그레스 바 애니메이션
    const progressInterval = setInterval(() => {
      progress += 2;
      this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;

      if (progress >= 100) {
        clearInterval(progressInterval);
        clearInterval(textInterval);

        // 결과 화면으로 이동
        setTimeout(() => {
          this.showResultScreen();
        }, 200);
      }
    }, 50);
  },

  /**
   * 결과 화면 표시
   */
  showResultScreen() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    // 결과 데이터 채우기
    this.elements.resultName.textContent = fortune.name;
    this.elements.resultDate.textContent = fortune.date;

    // 총운
    this.elements.overallEmoji.textContent = fortune.overall.emoji;
    this.elements.overallTitle.textContent = fortune.overall.title;
    this.elements.overallContent.textContent = fortune.overall.content;

    // 금전운
    this.elements.moneyEmoji.textContent = fortune.money.emoji;
    this.elements.moneyTitle.textContent = fortune.money.title;
    this.elements.moneyContent.textContent = fortune.money.content;

    // 연애운
    this.elements.loveEmoji.textContent = fortune.love.emoji;
    this.elements.loveTitle.textContent = fortune.love.title;
    this.elements.loveContent.textContent = fortune.love.content;

    // 행운 요소
    this.elements.luckyTime.textContent = fortune.luckyTime.display;
    this.elements.luckyColor.textContent = fortune.luckyColor.name;
    this.elements.luckyColorDot.style.backgroundColor = fortune.luckyColor.hex;
    this.elements.luckyNumbers.textContent = fortune.luckyNumbers.join(', ');
    this.elements.luckySnack.textContent = fortune.luckySnack;

    // 한마디 & 주의사항
    this.elements.adviceContent.textContent = fortune.advice;
    this.elements.cautionContent.textContent = fortune.caution;

    // 화면 전환
    this.showScreen('result');

    // 점수 애니메이션 (딜레이 후)
    setTimeout(() => {
      this.animateNumber(this.elements.overallScore, 0, fortune.overall.score, 1500);
    }, 300);

    // 카드 애니메이션
    this.animateCards();

    // 스트릭 배지
    this.showStreakBadge();
  },

  /**
   * 카드 등장 애니메이션
   */
  animateCards() {
    const cards = document.querySelectorAll('.animate-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      observer.observe(card);
    });
  },

  /**
   * 스트릭 배지 표시
   */
  showStreakBadge() {
    const streak = this.state.streak;

    if (streak >= 3) {
      let icon, text, gradient;

      if (streak >= 30) {
        icon = '💎';
        text = `${streak}일 연속 확인! 다이아몬드 등급!`;
        gradient = 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)';
      } else if (streak >= 7) {
        icon = '⭐';
        text = `${streak}일 연속 확인! 골드 등급!`;
        gradient = 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)';
      } else {
        icon = '🔥';
        text = `${streak}일 연속 확인 중!`;
        gradient = 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)';
      }

      this.elements.streakIcon.textContent = icon;
      this.elements.streakText.textContent = text;
      this.elements.streakBadge.style.background = gradient;
      this.elements.streakBadge.classList.add('active');
    }
  },

  /**
   * 스크롤 프로그레스 초기화
   */
  initScrollProgress() {
    window.addEventListener('scroll', () => {
      if (this.state.currentScreen !== 'result') return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;

      this.elements.scrollProgress.style.width = `${progress}%`;
    });
  },

  /**
   * 카카오톡 공유
   */
  shareKakao() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    // 카카오 SDK가 없으면 URL 공유로 대체
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
      this.showToast('카카오톡 공유는 준비 중입니다. 링크를 복사해주세요.');
      return;
    }

    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${fortune.name}님의 오늘 운세`,
        description: `총운 ${fortune.overall.score}점! ${fortune.overall.title} - ${fortune.advice}`,
        imageUrl: 'https://oneulunse.vercel.app/assets/share-image.png',
        link: {
          mobileWebUrl: window.location.origin,
          webUrl: window.location.origin
        }
      },
      buttons: [
        {
          title: '나도 운세 보기',
          link: {
            mobileWebUrl: window.location.origin,
            webUrl: window.location.origin
          }
        }
      ]
    });
  },

  /**
   * URL 복사
   */
  async shareUrl() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    const shareText = Fortune.generateShareText(fortune);
    const fullText = shareText + ' ' + window.location.origin;

    try {
      // Web Share API 시도
      if (navigator.share) {
        await navigator.share({
          title: '오늘의 운세',
          text: shareText,
          url: window.location.origin
        });
        return;
      }

      // 클립보드 복사
      await navigator.clipboard.writeText(fullText);
      this.showToast('링크가 복사되었습니다!');
    } catch (err) {
      // 폴백: 구식 방법
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('링크가 복사되었습니다!');
    }
  },

  /**
   * 토스트 메시지 표시
   */
  showToast(message) {
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add('show');

    setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, 2500);
  },

  /**
   * Service Worker 등록
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }
};

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
