const STORAGE_KEY = 'flashcard-vocab-cards';
const BACKEND_ENDPOINT = 'https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbw3dFLqUBNU0GAymUot3huzszC1r4nlyZi-ebBGVW0rFCqQSoi_2uYx28n1g0lgsCtb/exec/exec';

const defaultCards = [
  {
    word: 'apple',
    translation: '蘋果',
    pos: 'noun',
    example: 'I ate a red apple after school.',
    root: 'apple = 蘋果，本身為根詞。'
  },
  {
    word: 'bright',
    translation: '明亮的、聰明的',
    pos: 'adjective',
    example: 'The room was bright with sunlight.',
    root: 'bright 源自古英語 beorht，表示光亮。'
  }
];

const flashcardTab = document.getElementById('flashcard-tab');
const manageTab = document.getElementById('manage-tab');
const flashcardPage = document.getElementById('flashcard-page');
const managePage = document.getElementById('manage-page');
const vocabCard = document.getElementById('vocab-card');
const cardFront = document.getElementById('card-front');
const backTranslation = document.getElementById('back-translation');
const backPos = document.getElementById('back-pos');
const backExample = document.getElementById('back-example');
const backRoot = document.getElementById('back-root');
const statusFlashcard = document.getElementById('flashcard-status');
const prevWordBtn = document.getElementById('prev-word');
const nextWordBtn = document.getElementById('next-word');
const randomWordBtn = document.getElementById('random-word');

const wordForm = document.getElementById('word-form');
const wordInput = document.getElementById('word-input');
const translationInput = document.getElementById('translation-input');
const posInput = document.getElementById('pos-input');
const exampleInput = document.getElementById('example-input');
const rootInput = document.getElementById('root-input');
const autoFillBtn = document.getElementById('auto-fill');
const manageStatus = document.getElementById('manage-status');
const wordList = document.getElementById('word-list');
const searchInput = document.getElementById('search-input');
const searchSummary = document.getElementById('search-summary');

let cards = loadCards();
let currentIndex = 0;
let editingIndex = null;
let searchTerm = '';

function loadCards() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCards));
    return [...defaultCards];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultCards];
  } catch {
    return [...defaultCards];
  }
}

function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function switchTab(activeTab) {
  const showingFlashcard = activeTab === 'flashcard';
  flashcardTab.classList.toggle('active', showingFlashcard);
  manageTab.classList.toggle('active', !showingFlashcard);
  flashcardPage.classList.toggle('active', showingFlashcard);
  managePage.classList.toggle('active', !showingFlashcard);
}

function renderFlashcard() {
  if (!cards.length) {
    cardFront.textContent = '請新增單字';
    backTranslation.textContent = '—';
    backPos.textContent = '—';
    backExample.textContent = '—';
    backRoot.textContent = '—';
    return;
  }
  const card = cards[currentIndex];
  cardFront.textContent = card.word;
  backTranslation.textContent = card.translation || '尚無翻譯';
  backPos.textContent = card.pos || '尚無詞性';
  backExample.textContent = card.example || '尚無例句';
  backRoot.textContent = card.root || '尚無字根分析';
  statusFlashcard.textContent = `${currentIndex + 1} / ${cards.length}`;
}

function updateSearchSummary(visibleCount, totalCount) {
  if (!totalCount) {
    searchSummary.textContent = '目前沒有單字，請新增一個。';
    return;
  }
  if (!searchTerm.trim()) {
    searchSummary.textContent = `顯示全部 ${totalCount} 個單字`;
    return;
  }
  searchSummary.textContent = `搜尋結果：${visibleCount} / ${totalCount}`;
}

function getVisibleCards() {
  const query = searchTerm.trim().toLowerCase();
  return cards
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!query) return true;
      return [item.word, item.translation, item.pos, item.example, item.root]
        .some(value => value?.toLowerCase().includes(query));
    });
}

function renderWordList() {
  wordList.innerHTML = '';
  if (!cards.length) {
    wordList.innerHTML = '<div class="word-item">目前沒有單字，請新增一個。</div>';
    updateSearchSummary(0, 0);
    return;
  }

  const visibleCards = getVisibleCards();
  updateSearchSummary(visibleCards.length, cards.length);
  if (!visibleCards.length) {
    wordList.innerHTML = '<div class="word-item">找不到符合搜尋條件的單字。</div>';
    return;
  }

  visibleCards.forEach(({ item, index }) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'word-item';

    cardEl.innerHTML = `
      <div>
        <strong>${item.word}</strong>
        <div class="word-meta">翻譯：${item.translation || '—'}</div>
        <div class="word-meta">詞性：${item.pos || '—'}</div>
        <div class="word-meta">例句：${item.example || '—'}</div>
        <div class="word-meta">字根分析：${item.root || '—'}</div>
      </div>
      <div class="item-actions">
        <button type="button" data-action="edit" data-index="${index}">編輯</button>
        <button type="button" data-action="delete" data-index="${index}">刪除</button>
      </div>
    `;

    wordList.appendChild(cardEl);
  });
}

function clearForm() {
  editingIndex = null;
  wordForm.reset();
  manageStatus.textContent = '請輸入單字資訊，或按「自動填入」。';
}

function updateFormForEdit(index) {
  const item = cards[index];
  editingIndex = index;
  wordInput.value = item.word;
  translationInput.value = item.translation;
  posInput.value = item.pos;
  exampleInput.value = item.example;
  rootInput.value = item.root;
  manageStatus.textContent = `編輯中：${item.word}`;
}

function showManageStatus(message, isError = false) {
  manageStatus.textContent = message;
  manageStatus.style.color = isError ? '#b91c1c' : '#1f2937';
}

function setFlashcardStatus(message) {
  statusFlashcard.textContent = message;
}

function normalizeWord(value) {
  return value.trim();
}

function deriveRootAnalysis(word) {
  if (!word) return '';
  const lower = word.toLowerCase();
  const affixes = [
    { part: 're', meaning: '再次、回來' },
    { part: 'un', meaning: '不、非' },
    { part: 'in', meaning: '不、向內' },
    { part: 'im', meaning: '不、向內' },
    { part: 'dis', meaning: '分離、否定' },
    { part: 'pre', meaning: '前面' },
    { part: 'sub', meaning: '在下、次於' },
    { part: 'trans', meaning: '穿越、轉換' },
    { part: 'auto', meaning: '自己' }
  ];

  const found = affixes.find(item => lower.startsWith(item.part) && lower.length > item.part.length + 2);
  if (found) {
    return `${word} 包含字首「${found.part}」，通常表示「${found.meaning}」。`;
  }
  return `${word} 目前沒有明確的字根分析，建議查閱字源或常見字根。`;
}

async function autoFillWord() {
  const word = normalizeWord(wordInput.value);
  if (!word) {
    showManageStatus('請先輸入英文單字。', true);
    return;
  }

  showManageStatus('自動填入中，請稍候...');
  try {
    const [translation, dictionary] = await Promise.all([
      fetchTranslation(word),
      fetchDictionary(word)
    ]);

    translationInput.value = translation || translationInput.value;
    posInput.value = dictionary.pos || posInput.value;
    exampleInput.value = dictionary.example || exampleInput.value;
    rootInput.value = deriveRootAnalysis(word);
    showManageStatus('自動填入完成。請確認內容後儲存。');
  } catch (error) {
    showManageStatus(`自動填入失敗：${error.message}`, true);
  }
}

async function fetchTranslation(word) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('翻譯API回應錯誤');
  const payload = await response.json();
  const translation = payload.responseData?.translatedText;
  return translation && translation !== word ? translation : '';
}

async function fetchDictionary(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const response = await fetch(url);
  if (!response.ok) return { pos: '', example: '' };
  const payload = await response.json();
  const firstEntry = Array.isArray(payload) ? payload[0] : null;
  if (!firstEntry) return { pos: '', example: '' };

  const meaning = firstEntry.meanings?.[0];
  const definition = meaning?.definitions?.[0];
  const pos = meaning?.partOfSpeech || '';
  const example = definition?.example || firstEntry.meanings?.[0]?.definitions?.find(def => def.example)?.example || '';
  return { pos, example };
}

async function postWordToBackend(card) {
  if (!BACKEND_ENDPOINT || BACKEND_ENDPOINT.includes('YOUR_SCRIPT_ID')) {
    throw new Error('請先將 BACKEND_ENDPOINT 更新為已部署的 Google Apps Script 網址。');
  }

  const response = await fetch(BACKEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(card)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`後端回應錯誤：${response.status} ${message}`);
  }

  return response.json().catch(() => null);
}

async function addOrUpdateCard(event) {
  event.preventDefault();

  const word = normalizeWord(wordInput.value);
  if (!word) {
    showManageStatus('英文單字不能為空。', true);
    return;
  }

  const newCard = {
    word,
    translation: translationInput.value.trim(),
    pos: posInput.value.trim(),
    example: exampleInput.value.trim(),
    root: rootInput.value.trim()
  };

  if (editingIndex !== null) {
    cards[editingIndex] = newCard;
    showManageStatus(`已更新：${word}`);
  } else {
    cards.push(newCard);
    showManageStatus(`已新增：${word}`);
  }

  saveCards();
  renderWordList();
  renderFlashcard();

  try {
    showManageStatus('儲存中，正在送出後端...');
    await postWordToBackend(newCard);
    showManageStatus(`已儲存並同步：${word}`);
  } catch (error) {
    showManageStatus(`已儲存本機，但後端同步失敗：${error.message}`, true);
  }

  clearForm();
}

function handleWordListClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  if (action === 'edit') {
    updateFormForEdit(index);
  } else if (action === 'delete') {
    cards.splice(index, 1);
    saveCards();
    if (currentIndex >= cards.length) {
      currentIndex = Math.max(0, cards.length - 1);
    }
    showManageStatus('已刪除單字。');
    renderWordList();
    renderFlashcard();
  }
}

function showPreviousCard() {
  if (!cards.length) return;
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  renderFlashcard();
  vocabCard.classList.remove('flipped');
}

function showNextCard() {
  if (!cards.length) return;
  currentIndex = (currentIndex + 1) % cards.length;
  renderFlashcard();
  vocabCard.classList.remove('flipped');
}

function showRandomCard() {
  if (!cards.length) return;
  currentIndex = Math.floor(Math.random() * cards.length);
  renderFlashcard();
  vocabCard.classList.remove('flipped');
}

function toggleCardFlip() {
  vocabCard.classList.toggle('flipped');
}

function setupEvents() {
  flashcardTab.addEventListener('click', () => switchTab('flashcard'));
  manageTab.addEventListener('click', () => switchTab('manage'));
  vocabCard.addEventListener('click', toggleCardFlip);
  vocabCard.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCardFlip();
    }
  });
  prevWordBtn.addEventListener('click', showPreviousCard);
  nextWordBtn.addEventListener('click', showNextCard);
  randomWordBtn.addEventListener('click', showRandomCard);
  autoFillBtn.addEventListener('click', autoFillWord);
  wordForm.addEventListener('submit', addOrUpdateCard);
  wordList.addEventListener('click', handleWordListClick);
  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value;
    renderWordList();
  });
}

function init() {
  setupEvents();
  renderFlashcard();
  renderWordList();
  clearForm();
}

init();
