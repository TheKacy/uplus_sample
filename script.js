const STORAGE_KEY = 'trelloCloneData_v2';

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

function cards(...texts) {
  return texts.map(text => ({ id: uid(), text }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return {
    lists: [
      { id: uid(), title: '아이디어', cards: cards(
        '신규 랜딩 페이지 디자인 검토',
        '경쟁사 서비스 벤치마킹',
        '다크 모드 지원 검토',
        '사용자 인터뷰 일정 잡기'
      ) },
      { id: uid(), title: '할 일', cards: cards(
        '로그인 화면 UI 수정',
        'API 명세서 작성',
        '결제 모듈 연동',
        '회원가입 이메일 인증 추가',
        '관리자 페이지 권한 설정',
        '버그 리포트 #128 확인'
      ) },
      { id: uid(), title: '진행 중', cards: cards(
        '카드 드래그 앤 드롭 기능 구현',
        '프로필 이미지 업로드 기능',
        'DB 스키마 마이그레이션',
        '검색 기능 성능 개선'
      ) },
      { id: uid(), title: '검토', cards: cards(
        '코드 리뷰: 결제 모듈 PR',
        'QA 테스트 케이스 작성',
        '디자인 시안 피드백 반영'
      ) },
      { id: uid(), title: '완료', cards: cards(
        '프로젝트 초기 세팅',
        '깃허브 저장소 생성',
        '와이어프레임 제작',
        '팀 킥오프 미팅',
        'CI/CD 파이프라인 구축'
      ) }
    ]
  };
}

let state = loadState();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getList(listId) {
  return state.lists.find(l => l.id === listId);
}

const board = document.getElementById('board');

function render() {
  board.innerHTML = '';
  state.lists.forEach(list => board.appendChild(renderList(list)));
  board.appendChild(renderNewListForm());
}

function renderList(list) {
  const el = document.createElement('div');
  el.className = 'list';
  el.dataset.listId = list.id;

  const header = document.createElement('div');
  header.className = 'list-header';

  const titleInput = document.createElement('input');
  titleInput.className = 'list-title';
  titleInput.value = list.title;
  titleInput.addEventListener('change', () => {
    list.title = titleInput.value.trim() || list.title;
    save();
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'list-delete';
  delBtn.textContent = '✕';
  delBtn.title = '목록 삭제';
  delBtn.addEventListener('click', () => {
    if (confirm('이 목록을 삭제할까요?')) {
      state.lists = state.lists.filter(l => l.id !== list.id);
      save();
      render();
    }
  });

  header.appendChild(titleInput);
  header.appendChild(delBtn);
  el.appendChild(header);

  const cardsEl = document.createElement('div');
  cardsEl.className = 'cards';
  cardsEl.dataset.listId = list.id;
  list.cards.forEach(card => cardsEl.appendChild(renderCard(card, list.id)));
  attachDropZone(cardsEl, list.id);
  el.appendChild(cardsEl);

  el.appendChild(renderAddCardArea(list.id));

  return el;
}

function renderCard(card, listId) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.cardId = card.id;
  el.dataset.listId = listId;

  const text = document.createElement('div');
  text.textContent = card.text;
  text.style.paddingRight = '14px';
  text.addEventListener('click', () => {
    const next = prompt('카드 내용 수정', card.text);
    if (next !== null) {
      card.text = next.trim() || card.text;
      save();
      render();
    }
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'card-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = '카드 삭제';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const l = getList(listId);
    l.cards = l.cards.filter(c => c.id !== card.id);
    save();
    render();
  });

  el.appendChild(text);
  el.appendChild(removeBtn);

  el.addEventListener('dragstart', (e) => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, fromListId: listId }));
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
  });

  return el;
}

function attachDropZone(cardsEl, listId) {
  cardsEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    cardsEl.classList.add('drag-over');
  });
  cardsEl.addEventListener('dragleave', () => {
    cardsEl.classList.remove('drag-over');
  });
  cardsEl.addEventListener('drop', (e) => {
    e.preventDefault();
    cardsEl.classList.remove('drag-over');
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (err) { return; }
    if (!data || !data.cardId) return;

    const fromList = getList(data.fromListId);
    const toList = getList(listId);
    if (!fromList || !toList) return;

    const cardIndex = fromList.cards.findIndex(c => c.id === data.cardId);
    if (cardIndex === -1) return;
    const [card] = fromList.cards.splice(cardIndex, 1);

    const afterEl = [...cardsEl.querySelectorAll('.card')].find(c => {
      const rect = c.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (afterEl) {
      const insertIndex = toList.cards.findIndex(c => c.id === afterEl.dataset.cardId);
      toList.cards.splice(insertIndex, 0, card);
    } else {
      toList.cards.push(card);
    }

    save();
    render();
  });
}

function renderAddCardArea(listId) {
  const wrapper = document.createElement('div');

  const btn = document.createElement('button');
  btn.className = 'add-card-btn';
  btn.textContent = '+ 카드 추가';

  const form = document.createElement('div');
  form.className = 'add-form';
  form.style.display = 'none';

  const textarea = document.createElement('textarea');
  textarea.rows = 2;
  textarea.placeholder = '카드 내용을 입력하세요';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'confirm';
  confirmBtn.textContent = '카드 추가';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel';
  cancelBtn.textContent = '✕';

  function openForm() {
    btn.style.display = 'none';
    form.style.display = 'block';
    textarea.value = '';
    textarea.focus();
  }
  function closeForm() {
    form.style.display = 'none';
    btn.style.display = 'block';
  }
  function submit() {
    const text = textarea.value.trim();
    if (text) {
      getList(listId).cards.push({ id: uid(), text });
      save();
      render();
    } else {
      closeForm();
    }
  }

  btn.addEventListener('click', openForm);
  cancelBtn.addEventListener('click', closeForm);
  confirmBtn.addEventListener('click', submit);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      closeForm();
    }
  });

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(textarea);
  form.appendChild(actions);
  wrapper.appendChild(btn);
  wrapper.appendChild(form);

  return wrapper;
}

function renderNewListForm() {
  const wrapper = document.createElement('div');
  wrapper.className = 'new-list';

  const btn = document.createElement('button');
  btn.className = 'add-list-btn';
  btn.textContent = '+ 다른 목록 추가';

  const form = document.createElement('div');
  form.className = 'add-form';
  form.style.display = 'none';
  form.style.background = '#ebecf0';
  form.style.borderRadius = '8px';
  form.style.padding = '8px';

  const input = document.createElement('textarea');
  input.rows = 1;
  input.placeholder = '목록 제목 입력...';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'confirm';
  confirmBtn.textContent = '목록 추가';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel';
  cancelBtn.textContent = '✕';

  function openForm() {
    btn.style.display = 'none';
    form.style.display = 'block';
    input.value = '';
    input.focus();
  }
  function closeForm() {
    form.style.display = 'none';
    btn.style.display = 'block';
  }
  function submit() {
    const title = input.value.trim();
    if (title) {
      state.lists.push({ id: uid(), title, cards: [] });
      save();
      render();
    } else {
      closeForm();
    }
  }

  btn.addEventListener('click', openForm);
  cancelBtn.addEventListener('click', closeForm);
  confirmBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      closeForm();
    }
  });

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(input);
  form.appendChild(actions);
  wrapper.appendChild(btn);
  wrapper.appendChild(form);

  return wrapper;
}

render();
