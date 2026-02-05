/**
 * 오늘 운세 - 메인 앱 로직
 * Mystic Dark Glassmorphism Version
 */

const App = {
  // 상태
  state: {
    currentScreen: 'main',
    fortune: null,
    streak: 0,
    visitCount: 0,
    isSharedView: false,
    isDetailOpen: false
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
    this.initScrollProgress();
    this.registerServiceWorker();

    // 공유된 URL인지 확인
    this.checkSharedUrl();
  },

  /**
   * URL 인코딩 (이름 + 생년월일 → 짧은 코드)
   */
  encodeFortuneUrl(name, birth) {
    const data = `${name}|${birth}`;
    // Base64 인코딩 후 URL-safe하게 변환
    const encoded = btoa(unescape(encodeURIComponent(data)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encoded;
  },

  /**
   * URL 디코딩 (짧은 코드 → 이름 + 생년월일)
   */
  decodeFortuneUrl(code) {
    try {
      // URL-safe Base64를 일반 Base64로 변환
      let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
      // 패딩 추가
      while (base64.length % 4) {
        base64 += '=';
      }
      const decoded = decodeURIComponent(escape(atob(base64)));
      const [name, birth] = decoded.split('|');
      if (name && birth) {
        return { name, birth };
      }
    } catch (e) {
      console.error('URL 디코딩 실패:', e);
    }
    return null;
  },

  /**
   * 공유 URL 생성
   */
  generateShareUrl(name, birth) {
    const code = this.encodeFortuneUrl(name, birth);
    return `${window.location.origin}/${code}`;
  },

  /**
   * 공유된 URL 확인 및 처리
   */
  checkSharedUrl() {
    const path = window.location.pathname;
    // 루트(/)가 아니면 공유된 URL로 판단
    if (path && path !== '/' && path.length > 1) {
      const code = path.slice(1); // 앞의 / 제거
      const data = this.decodeFortuneUrl(code);

      if (data) {
        this.state.isSharedView = true;
        // 운세 생성 및 결과 표시
        this.state.fortune = Fortune.generate(data.name, data.birth);
        this.showResultScreen();
      }
    }
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

      // 결과 - 기본 정보
      resultName: document.getElementById('result-name'),
      resultDate: document.getElementById('result-date'),

      // 점수 오브
      overallScore: document.getElementById('overall-score'),
      overallEmoji: document.getElementById('overall-emoji'),
      overallTitle: document.getElementById('overall-title'),

      // 미니 운세 행
      moneyEmoji: document.getElementById('money-emoji'),
      moneyTitle: document.getElementById('money-title'),
      loveEmoji: document.getElementById('love-emoji'),
      loveTitle: document.getElementById('love-title'),

      // 행운 요소 칩
      luckyTime: document.getElementById('lucky-time'),
      luckyColor: document.getElementById('lucky-color'),
      luckyColorDot: document.getElementById('lucky-color-dot'),
      luckyNumbers: document.getElementById('lucky-numbers'),

      // 한마디
      adviceContent: document.getElementById('advice-content'),

      // 상세 섹션
      detailSection: document.getElementById('detail-section'),
      detailToggle: document.getElementById('detail-toggle'),
      overallContent: document.getElementById('overall-content'),
      moneyContent: document.getElementById('money-content'),
      loveContent: document.getElementById('love-content'),
      cautionContent: document.getElementById('caution-content'),

      // 공유 & 기타
      shareKakao: document.getElementById('share-kakao'),
      shareX: document.getElementById('share-x'),
      shareUrl: document.getElementById('share-url'),
      retryBtn: document.getElementById('retry-btn'),
      streakBadge: document.getElementById('streak-badge'),
      streakIcon: document.getElementById('streak-icon'),
      streakText: document.getElementById('streak-text'),
      scrollProgress: document.getElementById('scroll-progress'),
      toast: document.getElementById('toast')
    };
  },

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 폼 제출
    if (this.elements.fortuneForm) {
      this.elements.fortuneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // 입력 필드 에러 초기화 (먼저 바인딩 - 핵심 기능)
    if (this.elements.nameInput) {
      this.elements.nameInput.addEventListener('input', () => {
        this.elements.nameInput.classList.remove('error');
        if (this.elements.nameError) this.elements.nameError.textContent = '';
      });
    }

    // 생년월일 자동 포맷팅 (YYYY-MM-DD) - 핵심 기능
    if (this.elements.birthInput) {
      this.elements.birthInput.addEventListener('input', (e) => {
        this.elements.birthInput.classList.remove('error');
        if (this.elements.birthError) this.elements.birthError.textContent = '';
        this.formatBirthInput(e);
      });

      // 생년월일 붙여넣기 처리
      this.elements.birthInput.addEventListener('paste', (e) => {
        setTimeout(() => this.formatBirthInput({ target: this.elements.birthInput }), 0);
      });
    }

    // 공유 버튼
    if (this.elements.shareKakao) {
      this.elements.shareKakao.addEventListener('click', () => this.shareKakao());
    }
    if (this.elements.shareX) {
      this.elements.shareX.addEventListener('click', () => this.shareX());
    }
    if (this.elements.shareUrl) {
      this.elements.shareUrl.addEventListener('click', () => this.shareUrl());
    }

    // 상세 토글
    if (this.elements.detailToggle) {
      this.elements.detailToggle.addEventListener('click', () => this.toggleDetailSection());
    }

    // 다시보기
    if (this.elements.retryBtn) {
      this.elements.retryBtn.addEventListener('click', () => this.goToMain());
    }
  },

  /**
   * 상세 섹션 토글
   */
  toggleDetailSection() {
    this.state.isDetailOpen = !this.state.isDetailOpen;
    const detailSection = this.elements.detailSection;
    const toggleBtn = this.elements.detailToggle;
    const icon = toggleBtn.querySelector('svg');

    if (this.state.isDetailOpen) {
      detailSection.classList.add('active');
      icon.style.transform = 'rotate(180deg)';
      toggleBtn.querySelector('span:last-child').textContent = '접기';

      // 상세 섹션으로 스크롤
      setTimeout(() => {
        detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      detailSection.classList.remove('active');
      icon.style.transform = 'rotate(0deg)';
      toggleBtn.querySelector('span:last-child').textContent = '상세';
    }
  },

  /**
   * 생년월일 입력 자동 포맷팅
   */
  formatBirthInput(e) {
    const input = e.target;
    let value = input.value.replace(/\D/g, ''); // 숫자만 추출

    // 최대 8자리 (YYYYMMDD)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // 자동 하이픈 삽입
    let formatted = '';
    if (value.length > 0) {
      formatted = value.slice(0, 4); // YYYY
    }
    if (value.length > 4) {
      formatted += '-' + value.slice(4, 6); // -MM
    }
    if (value.length > 6) {
      formatted += '-' + value.slice(6, 8); // -DD
    }

    input.value = formatted;
  },

  /**
   * 생년월일 유효성 검사
   */
  validateBirthInput(value) {
    // 형식 검사 (YYYY-MM-DD)
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) {
      return { valid: false, message: '올바른 형식으로 입력해주세요 (YYYY-MM-DD)' };
    }

    const [year, month, day] = value.split('-').map(Number);
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    // 연도 범위 검사 (1900 ~ 현재)
    if (year < 1900 || year > today.getFullYear()) {
      return { valid: false, message: '올바른 연도를 입력해주세요' };
    }

    // 월 범위 검사
    if (month < 1 || month > 12) {
      return { valid: false, message: '올바른 월을 입력해주세요 (01-12)' };
    }

    // 일 범위 검사
    const lastDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > lastDay) {
      return { valid: false, message: '올바른 일을 입력해주세요' };
    }

    // 미래 날짜 검사
    if (birthDate > today) {
      return { valid: false, message: '미래 날짜는 입력할 수 없습니다' };
    }

    return { valid: true };
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
      this.elements.birthError.textContent = '생년월일을 입력해주세요';
      isValid = false;
    } else {
      const birthValidation = this.validateBirthInput(birth);
      if (!birthValidation.valid) {
        this.elements.birthInput.classList.add('error');
        this.elements.birthError.textContent = birthValidation.message;
        isValid = false;
      }
    }

    if (!isValid) return;

    // 데이터 저장
    localStorage.setItem('fortune_name', name);
    localStorage.setItem('fortune_birth', birth);

    // 운세 생성
    this.state.fortune = Fortune.generate(name, birth);
    this.state.isSharedView = false;

    // URL 업데이트 (히스토리에 추가)
    const shareUrl = this.generateShareUrl(name, birth);
    const code = this.encodeFortuneUrl(name, birth);
    window.history.pushState({ name, birth }, '', `/${code}`);

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
   * 메인 화면으로 이동 (URL 초기화)
   */
  goToMain() {
    this.state.isSharedView = false;
    this.state.isDetailOpen = false;

    // 상세 섹션 초기화
    if (this.elements.detailSection) {
      this.elements.detailSection.classList.remove('active');
    }
    if (this.elements.detailToggle) {
      const icon = this.elements.detailToggle.querySelector('svg');
      if (icon) icon.style.transform = 'rotate(0deg)';
      const label = this.elements.detailToggle.querySelector('span:last-child');
      if (label) label.textContent = '상세';
    }

    window.history.pushState({}, '', '/');
    this.showScreen('main');
  },

  /**
   * 로딩 화면 표시
   */
  showLoadingScreen() {
    this.showScreen('loading');

    const loadingTexts = [
      '오늘 운세를 불러오는 중...',
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

    // 상세 섹션 초기화
    this.state.isDetailOpen = false;
    if (this.elements.detailSection) {
      this.elements.detailSection.classList.remove('active');
    }

    // 결과 데이터 채우기
    this.elements.resultName.textContent = fortune.name;
    this.elements.resultDate.textContent = fortune.date;

    // 점수 오브
    this.elements.overallEmoji.textContent = fortune.overall.emoji;
    this.elements.overallTitle.textContent = fortune.overall.title;

    // 미니 운세 행
    this.elements.moneyEmoji.textContent = fortune.money.emoji;
    this.elements.moneyTitle.textContent = fortune.money.title;
    this.elements.loveEmoji.textContent = fortune.love.emoji;
    this.elements.loveTitle.textContent = fortune.love.title;

    // 행운 요소 칩
    this.elements.luckyTime.textContent = fortune.luckyTime.display;
    this.elements.luckyColor.textContent = fortune.luckyColor.name;
    this.elements.luckyColorDot.style.backgroundColor = fortune.luckyColor.hex;
    this.elements.luckyNumbers.textContent = fortune.luckyNumbers.join(', ');

    // 한마디
    this.elements.adviceContent.textContent = `"${fortune.advice}"`;

    // 상세 섹션 내용
    this.elements.overallContent.textContent = fortune.overall.content;
    this.elements.moneyContent.textContent = fortune.money.content;
    this.elements.loveContent.textContent = fortune.love.content;
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
        gradient = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(96, 165, 250, 0.15) 100%)';
      } else if (streak >= 7) {
        icon = '⭐';
        text = `${streak}일 연속 확인! 골드 등급!`;
        gradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.15) 100%)';
      } else {
        icon = '🔥';
        text = `${streak}일 연속 확인 중!`;
        gradient = 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.15) 100%)';
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
   * 현재 공유 URL 가져오기
   */
  getShareUrl() {
    const fortune = this.state.fortune;
    if (!fortune) return window.location.origin;
    return this.generateShareUrl(fortune.name, fortune.date.includes('-') ? fortune.date : localStorage.getItem('fortune_birth'));
  },

  /**
   * 카카오톡 공유
   */
  shareKakao() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    const shareUrl = window.location.href;

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
        imageUrl: 'https://oneulunse.com/assets/og-image.png',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl
        }
      },
      buttons: [
        {
          title: '운세 결과 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl
          }
        }
      ]
    });
  },

  /**
   * X (Twitter) 공유
   */
  shareX() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    const shareUrl = window.location.href;

    // 점수에 따른 호기심 자극 문구
    let hookText, emoji;
    if (fortune.overall.score >= 90) {
      hookText = '대박 운세가 나왔어요';
      emoji = '🔥';
    } else if (fortune.overall.score >= 80) {
      hookText = '오늘 운 좋을 듯';
      emoji = '✨';
    } else if (fortune.overall.score >= 70) {
      hookText = '괜찮은 하루가 될 것 같아요';
      emoji = '🌟';
    } else if (fortune.overall.score >= 60) {
      hookText = '평범하지만 나쁘지 않은 운세';
      emoji = '🙂';
    } else {
      hookText = '오늘은 조심해야 할 듯';
      emoji = '🤔';
    }

    // 짧고 임팩트 있는 트윗 텍스트
    const tweetText = `🔮 ${fortune.overall.score}점! ${hookText} ${emoji}\n\n` +
                      `행운의 번호: ${fortune.luckyNumbers.join(', ')}\n` +
                      `"${fortune.advice}"\n\n` +
                      `내 운세도 확인해보기 👇`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

    window.open(tweetUrl, '_blank', 'width=550,height=420');
  },

  /**
   * URL 복사
   */
  async shareUrl() {
    const fortune = this.state.fortune;
    if (!fortune) return;

    const shareUrl = window.location.href;
    const shareText = Fortune.generateShareText(fortune);
    const fullText = shareText + ' ' + shareUrl;

    try {
      // Web Share API 시도
      if (navigator.share) {
        await navigator.share({
          title: `${fortune.name}님의 오늘 운세`,
          text: shareText,
          url: shareUrl
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
