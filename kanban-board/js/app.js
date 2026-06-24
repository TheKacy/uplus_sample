/*
  [개발자 인계]
  - 이 파일은 기획자가 제작한 HTML/CSS/JS 프로토타입입니다.
  - 실제 개발 시 React 등 프레임워크로 재구현 필요
  - 데이터 구조는 js/app.js 상단 state 객체 참고
  - 드래그앤드롭은 HTML5 기본 API 사용 (추후 라이브러리 교체 권장)
*/

const STORAGE_KEY = 'kanbanBoardData_v3';
const MAX_TAGS = 3;

const PRIORITY_LABEL = {
  high: '🔴 높음',
  medium: '🟡 중간',
  low: '🟢 낮음'
};

/*
  state.columns[].cards[] 구조
  {
    id, title, desc, dueDate (YYYY-MM-DD 또는 ''), priority ('high'|'medium'|'low'|''),
    tags: [{ color: '#hex', text: '태그명' }]
  }
*/
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

function makeCards(list) {
  return list.map(card => ({ id: uid(), desc: '', dueDate: '', priority: '', tags: [], ...card }));
}

function defaultState() {
  return {
    columns: [
      {
        id: uid(),
        title: '할 일',
        cards: makeCards([
          {
            title: '신규 로그인 화면 UI 디자인',
            desc: '소셜 로그인 버튼 추가, 다크모드 대응 필요',
            dueDate: '2026-07-01',
            priority: 'medium',
            tags: [{ color: '#C377E0', text: '디자인' }]
          },
          {
            title: '결제 모듈 PG사 연동 검토',
            desc: '토스페이먼츠 vs 아임포트 비교 후 선정',
            dueDate: '2026-06-20',
            priority: 'high',
            tags: [{ color: '#0079BF', text: '백엔드' }, { color: '#EB5A46', text: '긴급' }]
          },
          {
            title: '알림 푸시 기능 기획서 작성',
            priority: 'low',
            tags: [{ color: '#F2D600', text: '기획' }]
          },
          {
            title: '사용자 인터뷰 질문지 준비',
            desc: '신규 기능 우선순위 조사용',
            dueDate: '2026-07-10',
            priority: 'low'
          },
          {
            title: '서버 인프라 비용 산정',
            desc: 'AWS vs GCP 견적 비교',
            dueDate: '2026-06-30',
            priority: 'medium',
            tags: [{ color: '#0079BF', text: '인프라' }]
          }
        ])
      },
      {
        id: uid(),
        title: '진행 중',
        cards: makeCards([
          {
            title: '회원가입 이메일 인증 기능 개발',
            desc: '인증 메일 발송 API 연동 중',
            dueDate: '2026-06-26',
            priority: 'high',
            tags: [{ color: '#0079BF', text: '백엔드' }]
          },
          {
            title: '메인 대시보드 반응형 레이아웃 작업',
            desc: '태블릿 해상도에서 깨지는 부분 수정 중',
            dueDate: '2026-06-25',
            priority: 'medium',
            tags: [{ color: '#C377E0', text: '프론트엔드' }]
          },
          {
            title: 'API 명세서 v2 업데이트',
            priority: 'low',
            tags: [{ color: '#F2D600', text: '문서' }]
          },
          {
            title: 'QA 테스트 케이스 작성',
            desc: '결제 플로우 엣지케이스 정리 중',
            dueDate: '2026-06-28',
            priority: 'medium',
            tags: [{ color: '#61BD4F', text: 'QA' }]
          },
          {
            title: '마케팅 랜딩페이지 카피 수정',
            desc: '전환율 개선용 A/B 테스트 문구 작업',
            dueDate: '2026-07-03',
            priority: 'low',
            tags: [{ color: '#FF9F1A', text: '마케팅' }]
          }
        ])
      },
      {
        id: uid(),
        title: '완료',
        cards: makeCards([
          {
            title: '프로젝트 킥오프 미팅',
            desc: '일정 및 역할 분담 완료',
            dueDate: '2026-06-01',
            priority: 'low'
          },
          {
            title: '와이어프레임 1차 시안 완료',
            dueDate: '2026-06-05',
            priority: 'medium',
            tags: [{ color: '#C377E0', text: '디자인' }]
          },
          {
            title: '개발 환경 세팅 (CI/CD)',
            desc: 'GitHub Actions 파이프라인 구축',
            dueDate: '2026-06-10',
            priority: 'high',
            tags: [{ color: '#0079BF', text: '인프라' }]
          },
          {
            title: '회원 DB 스키마 설계',
            dueDate: '2026-06-12',
            priority: 'medium',
            tags: [{ color: '#0079BF', text: '백엔드' }]
          },
          {
            title: '경쟁사 서비스 벤치마킹 보고서',
            desc: '5개사 비교 분석 완료',
            dueDate: '2026-06-15',
            priority: 'low',
            tags: [{ color: '#F2D600', text: '기획' }]
          }
        ])
      }
    ]
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return defaultState();
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getColumn(columnId) {
  return state.columns.find(c => c.id === columnId);
}

function getCard(columnId, cardId) {
  const column = getColumn(columnId);
  return column ? column.cards.find(c => c.id === cardId) : null;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- 렌더링 ---------- */

const boardEl = document.getElementById('board');

function render() {
  boardEl.innerHTML = '';
  state.columns.forEach(column => boardEl.appendChild(renderColumn(column)));
  boardEl.appendChild(renderAddColumn());
}

function renderColumn(column) {
  const el = document.createElement('section');
  el.className = 'column';
  el.dataset.columnId = column.id;

  const header = document.createElement('div');
  header.className = 'column-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'column-title';
  titleEl.textContent = column.title;
  titleEl.title = '더블클릭하여 이름 수정';
  titleEl.addEventListener('dblclick', () => startEditColumnTitle(titleEl, column));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'column-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '컬럼 삭제';
  deleteBtn.addEventListener('click', () => {
    if (confirm(`"${column.title}" 컬럼을 삭제할까요? 포함된 카드도 모두 삭제됩니다.`)) {
      state.columns = state.columns.filter(c => c.id !== column.id);
      saveState();
      render();
    }
  });

  header.appendChild(titleEl);
  header.appendChild(deleteBtn);
  el.appendChild(header);

  const cardList = document.createElement('div');
  cardList.className = 'card-list';
  cardList.dataset.columnId = column.id;
  column.cards.forEach(card => cardList.appendChild(renderCard(card, column.id)));
  attachDropZone(cardList, column.id);
  el.appendChild(cardList);

  const addCardBtn = document.createElement('button');
  addCardBtn.type = 'button';
  addCardBtn.className = 'add-card-btn';
  addCardBtn.textContent = '+ 카드 추가';
  addCardBtn.addEventListener('click', () => openModal('create', column.id, null));
  el.appendChild(addCardBtn);

  return el;
}

function startEditColumnTitle(titleEl, column) {
  const input = document.createElement('input');
  input.className = 'column-title-input';
  input.value = column.title;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const next = input.value.trim();
    column.title = next || column.title;
    saveState();
    render();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      input.removeEventListener('blur', commit);
      render();
    }
  });
}

function renderCard(card, columnId) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.cardId = card.id;
  el.dataset.columnId = columnId;

  const topRow = document.createElement('div');
  topRow.className = 'card-top-row';

  if (card.priority) {
    const badge = document.createElement('span');
    badge.className = 'priority-badge';
    badge.textContent = PRIORITY_LABEL[card.priority] || '';
    topRow.appendChild(badge);
  } else {
    topRow.appendChild(document.createElement('span'));
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'card-remove-btn';
  removeBtn.textContent = '×';
  removeBtn.title = '카드 삭제';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('이 카드를 삭제할까요?')) {
      const column = getColumn(columnId);
      column.cards = column.cards.filter(c => c.id !== card.id);
      saveState();
      render();
    }
  });
  topRow.appendChild(removeBtn);
  el.appendChild(topRow);

  const titleEl = document.createElement('div');
  titleEl.className = 'card-title';
  titleEl.textContent = card.title;
  el.appendChild(titleEl);

  if (card.desc) {
    const descEl = document.createElement('div');
    descEl.className = 'card-desc';
    descEl.textContent = card.desc;
    el.appendChild(descEl);
  }

  if (card.dueDate) {
    const overdue = card.dueDate < todayStr();
    const dueEl = document.createElement('div');
    dueEl.className = 'card-due' + (overdue ? ' overdue' : '');
    dueEl.textContent = (overdue ? '⚠️ ' : '📅 ') + card.dueDate;
    el.appendChild(dueEl);
  }

  if (card.tags && card.tags.length) {
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    card.tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.style.background = tag.color;
      pill.textContent = tag.text;
      tagList.appendChild(pill);
    });
    el.appendChild(tagList);
  }

  el.addEventListener('click', () => openModal('edit', columnId, card.id));

  el.addEventListener('dragstart', (e) => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, fromColumnId: columnId }));
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
  });

  return el;
}

function attachDropZone(cardListEl, columnId) {
  cardListEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    cardListEl.classList.add('drag-over');
  });
  cardListEl.addEventListener('dragleave', () => {
    cardListEl.classList.remove('drag-over');
  });
  cardListEl.addEventListener('drop', (e) => {
    e.preventDefault();
    cardListEl.classList.remove('drag-over');

    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (err) { return; }
    if (!data || !data.cardId) return;

    const fromColumn = getColumn(data.fromColumnId);
    const toColumn = getColumn(columnId);
    if (!fromColumn || !toColumn) return;

    const cardIndex = fromColumn.cards.findIndex(c => c.id === data.cardId);
    if (cardIndex === -1) return;
    const [card] = fromColumn.cards.splice(cardIndex, 1);

    const afterEl = [...cardListEl.querySelectorAll('.card')].find(c => {
      const rect = c.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (afterEl) {
      const insertIndex = toColumn.cards.findIndex(c => c.id === afterEl.dataset.cardId);
      toColumn.cards.splice(insertIndex, 0, card);
    } else {
      toColumn.cards.push(card);
    }

    saveState();
    render();
  });
}

function renderAddColumn() {
  const wrapper = document.createElement('div');
  wrapper.className = 'add-column';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'add-column-btn';
  btn.textContent = '+ 컬럼 추가';

  const form = document.createElement('div');
  form.className = 'add-column-form';
  form.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '컬럼 이름 입력...';
  input.maxLength = 30;

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '6px';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn-primary';
  confirmBtn.textContent = '추가';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-secondary';
  cancelBtn.textContent = '취소';

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
      state.columns.push({ id: uid(), title, cards: [] });
      saveState();
      render();
    } else {
      closeForm();
    }
  }

  btn.addEventListener('click', openForm);
  cancelBtn.addEventListener('click', closeForm);
  confirmBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
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

/* ---------- 카드 생성/수정 모달 ---------- */

const modalOverlay = document.getElementById('card-modal');
const modalTitleEl = document.getElementById('modal-title');
const cardForm = document.getElementById('card-form');
const titleInput = document.getElementById('card-title-input');
const descInput = document.getElementById('card-desc-input');
const dueInput = document.getElementById('card-due-input');
const tagColorInput = document.getElementById('tag-color-input');
const tagTextInput = document.getElementById('tag-text-input');
const tagAddBtn = document.getElementById('tag-add-btn');
const tagListEl = document.getElementById('tag-list');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

let modalMode = 'create';
let modalColumnId = null;
let modalCardId = null;
let workingTags = [];

function openModal(mode, columnId, cardId) {
  modalMode = mode;
  modalColumnId = columnId;
  modalCardId = cardId;

  cardForm.reset();
  workingTags = [];

  if (mode === 'edit') {
    const card = getCard(columnId, cardId);
    modalTitleEl.textContent = '카드 수정';
    titleInput.value = card.title || '';
    descInput.value = card.desc || '';
    dueInput.value = card.dueDate || '';
    if (card.priority) {
      const radio = cardForm.querySelector(`input[name="priority"][value="${card.priority}"]`);
      if (radio) radio.checked = true;
    }
    workingTags = card.tags ? card.tags.map(t => ({ ...t })) : [];
  } else {
    modalTitleEl.textContent = '카드 추가';
  }

  renderTagList();
  modalOverlay.classList.remove('hidden');
  titleInput.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalColumnId = null;
  modalCardId = null;
  workingTags = [];
}

function renderTagList() {
  tagListEl.innerHTML = '';
  workingTags.forEach((tag, index) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.style.background = tag.color;

    const label = document.createElement('span');
    label.textContent = tag.text;
    pill.appendChild(label);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tag-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      workingTags.splice(index, 1);
      renderTagList();
    });
    pill.appendChild(removeBtn);

    tagListEl.appendChild(pill);
  });
  tagAddBtn.disabled = workingTags.length >= MAX_TAGS;
}

tagAddBtn.addEventListener('click', () => {
  if (workingTags.length >= MAX_TAGS) return;
  const text = tagTextInput.value.trim();
  if (!text) return;
  workingTags.push({ color: tagColorInput.value, text });
  tagTextInput.value = '';
  renderTagList();
});

tagTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    tagAddBtn.click();
  }
});

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

cardForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  const priorityRadio = cardForm.querySelector('input[name="priority"]:checked');

  const cardData = {
    title,
    desc: descInput.value.trim(),
    dueDate: dueInput.value || '',
    priority: priorityRadio ? priorityRadio.value : '',
    tags: workingTags.map(t => ({ ...t }))
  };

  if (modalMode === 'create') {
    const column = getColumn(modalColumnId);
    column.cards.push({ id: uid(), ...cardData });
  } else {
    const column = getColumn(modalColumnId);
    const card = column.cards.find(c => c.id === modalCardId);
    Object.assign(card, cardData);
  }

  saveState();
  closeModal();
  render();
});

render();
