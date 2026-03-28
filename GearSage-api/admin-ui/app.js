const state = {
  token: localStorage.getItem('admin_token') || '',
  adminUser: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  activeView: 'topics',
};

const viewMeta = {
  topics: {
    title: '待审核帖子',
    subtitle: '查看待审核帖子并执行通过、驳回、下架。',
  },
  comments: {
    title: '评论审核',
    subtitle: '承接评论待审与人工复核动作。',
  },
  users: {
    title: '用户管理',
    subtitle: '处理封禁、解封与用户基础状态查看。',
  },
  logs: {
    title: '审核日志',
    subtitle: '查看后台操作留痕。',
  },
  rules: {
    title: '规则配置',
    subtitle: '维护最小黑名单词能力。',
  },
};

const el = {
  loginScreen: document.getElementById('login-screen'),
  consoleScreen: document.getElementById('console-screen'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  adminUsername: document.getElementById('admin-username'),
  adminRole: document.getElementById('admin-role'),
  refreshButton: document.getElementById('refresh-button'),
  logoutButton: document.getElementById('logout-button'),
  viewTitle: document.getElementById('view-title'),
  viewSubtitle: document.getElementById('view-subtitle'),
  globalMessage: document.getElementById('global-message'),
  drawer: document.getElementById('detail-drawer'),
  drawerTitle: document.getElementById('drawer-title'),
  drawerContent: document.getElementById('drawer-content'),
  drawerClose: document.getElementById('drawer-close'),
};

function showMessage(message, type = 'info') {
  el.globalMessage.textContent = message;
  el.globalMessage.classList.remove('hidden');
  el.globalMessage.style.color = type === 'error' ? '#cc3d3d' : '#1f6feb';
  el.globalMessage.style.background =
    type === 'error' ? 'rgba(204,61,61,0.08)' : 'rgba(31,111,235,0.08)';
}

function clearMessage() {
  el.globalMessage.classList.add('hidden');
}

function setAuth(token, adminUser) {
  state.token = token || '';
  state.adminUser = adminUser || null;
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
  if (adminUser) {
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
  } else {
    localStorage.removeItem('admin_user');
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    throw new Error(`接口返回非 JSON：${response.status}`);
  }

  if (!response.ok || payload.code !== 0) {
    const message = payload?.message || payload?.error || `请求失败(${response.status})`;
    throw new Error(message);
  }

  return payload.data;
}

function switchScreen(isLoggedIn) {
  el.loginScreen.classList.toggle('hidden', isLoggedIn);
  el.loginScreen.classList.toggle('screen-active', !isLoggedIn);
  el.consoleScreen.classList.toggle('hidden', !isLoggedIn);

  if (isLoggedIn && state.adminUser) {
    el.adminUsername.textContent = state.adminUser.username;
    el.adminRole.textContent = state.adminUser.role || 'super_admin';
  }
}

function setActiveView(view) {
  state.activeView = view;
  document.querySelectorAll('.nav-item').forEach((node) => {
    node.classList.toggle('nav-item-active', node.dataset.view === view);
  });
  document.querySelectorAll('.view-section').forEach((node) => {
    node.classList.toggle('hidden', node.id !== `view-${view}`);
  });
  el.viewTitle.textContent = viewMeta[view].title;
  el.viewSubtitle.textContent = viewMeta[view].subtitle;
  clearMessage();
  loadActiveView();
}

function openDrawer(title, data) {
  el.drawerTitle.textContent = title;
  el.drawerContent.innerHTML = renderDrawerContent(data);
  el.drawer.classList.remove('hidden');
}

function closeDrawer() {
  el.drawer.classList.add('hidden');
}

function renderEmpty(containerId, text) {
  document.getElementById(containerId).innerHTML = `<div class="empty-state">${text}</div>`;
}

function renderTable(containerId, columns, rows) {
  if (!rows.length) {
    renderEmpty(containerId, '暂无数据');
    return;
  }

  const head = columns.map((column) => `<th>${column.label}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${column.render(row)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  document.getElementById(containerId).innerHTML =
    `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function makePrimaryCell(title, subtitle = '') {
  return `
    <div class="cell-main">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="cell-sub">${escapeHtml(subtitle)}</div>` : ''}
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

function normalizeMediaUrls(images = []) {
  const source = Array.isArray(images) ? images : [images];
  const urls = source
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return String(
          item.url
          || item.src
          || item.fileID
          || item.fileId
          || item.path
          || item.tempFileURL
          || ''
        ).trim();
      }
      return '';
    })
    .filter(Boolean);

  return [...new Set(urls)];
}

function getTopicStatusLabel(status) {
  const normalized = Number(status || 0);
  if (normalized === 1) return '待审核';
  if (normalized === 2) return '已通过';
  if (normalized === 9) return '已驳回/下架';
  if (normalized === 0) return '草稿';
  return String(status ?? '-');
}

function getCommentStatusLabel(status, isVisible) {
  const normalized = Number(status || 0);
  if (normalized === 0) return '待审核';
  if (normalized === 2) return '已通过';
  if (normalized === 9) return Number(isVisible || 0) === 1 ? '已驳回' : '已驳回/删除';
  return String(status ?? '-');
}

function renderMediaPreview(images = []) {
  const list = normalizeMediaUrls(images);
  if (!list.length) {
    return '<div class="drawer-empty">无图片</div>';
  }

  return `
    <div class="media-grid">
      ${list.map((url, index) => `
        <a class="media-card" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">
          <img src="${escapeAttr(url)}" alt="upload-${index + 1}" />
          <span>查看原图 ${index + 1}</span>
        </a>
      `).join('')}
    </div>
  `;
}

function renderKeyValueSection(title, rows = []) {
  const normalized = rows.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '');
  if (!normalized.length) {
    return '';
  }

  return `
    <section class="drawer-section">
      <h4>${escapeHtml(title)}</h4>
      <div class="kv-grid">
        ${normalized.map((row) => `
          <div class="kv-item">
            <div class="kv-label">${escapeHtml(row.label)}</div>
            <div class="kv-value">${escapeHtml(row.value)}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderJsonBlock(title, value) {
  if (value === undefined || value === null) {
    return '';
  }

  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return `
    <section class="drawer-section">
      <h4>${escapeHtml(title)}</h4>
      <pre class="json-block">${escapeHtml(text)}</pre>
    </section>
  `;
}

function renderTopicDetail(data) {
  return `
    ${renderKeyValueSection('帖子信息', [
      { label: '帖子 ID', value: data.id },
      { label: '标题', value: data.title || '-' },
      { label: '作者', value: data.authorName || '-' },
      { label: '作者手机号', value: data.authorPhone || '-' },
      { label: '状态', value: getTopicStatusLabel(data.status) },
      { label: '系统审核结果', value: data.moderationResult || '-' },
      { label: '风险原因', value: data.moderationRiskReason || '-' },
      { label: '创建时间', value: data.createTime || '-' },
      { label: '更新时间', value: data.updateTime || '-' },
    ])}
    ${renderJsonBlock('正文', data.content || '')}
    <section class="drawer-section">
      <h4>用户上传图片</h4>
      ${renderMediaPreview(data.images)}
    </section>
    ${renderJsonBlock('扩展字段', data.extra || {})}
    ${renderJsonBlock('审核记录', data.moderationRecords || [])}
    ${renderJsonBlock('后台日志', data.adminLogs || [])}
  `;
}

function renderCommentDetail(data) {
  return `
    ${renderKeyValueSection('评论信息', [
      { label: '评论 ID', value: data.id },
      { label: '帖子 ID', value: data.topicId },
      { label: '帖子标题', value: data.topicTitle || '-' },
      { label: '用户', value: data.userName || '-' },
      { label: '手机号', value: data.userPhone || '-' },
      { label: '状态', value: getCommentStatusLabel(data.status, data.isVisible) },
      { label: '系统审核结果', value: data.moderationResult || '-' },
      { label: '风险原因', value: data.moderationRiskReason || '-' },
      { label: '创建时间', value: data.createTime || '-' },
      { label: '更新时间', value: data.updateTime || '-' },
    ])}
    ${renderJsonBlock('评论内容', data.content || '')}
    ${renderJsonBlock('审核记录', data.moderationRecords || [])}
    ${renderJsonBlock('后台日志', data.adminLogs || [])}
  `;
}

function renderUserDetail(data) {
  return `
    ${renderKeyValueSection('用户信息', [
      { label: '用户 ID', value: data.id },
      { label: '昵称', value: data.nickName || '-' },
      { label: '手机号', value: data.phone || '-' },
      { label: '状态', value: data.status },
      { label: '积分', value: data.points },
      { label: '帖子数', value: data.topicCount },
      { label: '评论数', value: data.commentCount },
      { label: '创建时间', value: data.createTime || '-' },
      { label: '更新时间', value: data.updateTime || '-' },
    ])}
    ${renderJsonBlock('原始数据', data)}
  `;
}

function renderDrawerContent(data) {
  if (data && Array.isArray(data.moderationRecords) && Array.isArray(data.adminLogs) && Object.prototype.hasOwnProperty.call(data, 'images')) {
    return renderTopicDetail(data);
  }

  if (data && Array.isArray(data.moderationRecords) && Array.isArray(data.adminLogs) && Object.prototype.hasOwnProperty.call(data, 'topicTitle')) {
    return renderCommentDetail(data);
  }

  if (data && Object.prototype.hasOwnProperty.call(data, 'points') && Object.prototype.hasOwnProperty.call(data, 'phone')) {
    return renderUserDetail(data);
  }

  return `<pre class="json-block">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
}

async function loadTopics() {
  const status = document.getElementById('topics-status').value;
  const keyword = document.getElementById('topics-keyword').value.trim();
  const list = await request(
    `/admin/review/topics?status=${encodeURIComponent(status)}&keyword=${encodeURIComponent(keyword)}&limit=50`,
  );

  renderTable('topics-table', [
    {
      label: '帖子',
      render: (row) => makePrimaryCell(`#${row.id} ${row.title}`, `作者：${row.authorName || '-'} / 状态：${getTopicStatusLabel(row.status)}`),
    },
    {
      label: '系统审核',
      render: (row) =>
        makePrimaryCell(row.moderationResult || '-', `${row.moderationProvider || '-'} / ${row.moderationRiskReason || '-'}`),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(row.createTime || '-', `更新时间：${row.updateTime || '-'}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-topic-detail="${row.id}">详情</button>
          ${Number(row.status) === 1 ? `<button class="success" data-topic-pass="${row.id}">通过</button>` : ''}
          ${Number(row.status) === 1 ? `<button class="warning" data-topic-reject="${row.id}">驳回</button>` : ''}
          ${Number(row.status) === 2 ? `<button class="danger" data-topic-remove="${row.id}">下架</button>` : ''}
          ${Number(row.status) === 9 ? `<button class="success" data-topic-restore="${row.id}">恢复显示</button>` : ''}
        </div>
      `,
    },
  ], list);
}

async function loadComments() {
  const status = document.getElementById('comments-status').value;
  const keyword = document.getElementById('comments-keyword').value.trim();
  const list = await request(
    `/admin/review/comments?status=${encodeURIComponent(status)}&keyword=${encodeURIComponent(keyword)}&limit=50`,
  );

  renderTable('comments-table', [
    {
      label: '评论',
      render: (row) => makePrimaryCell(`#${row.id} ${row.content}`, `帖子：${row.topicTitle || '-'} / 用户：${row.userName || '-'}`),
    },
    {
      label: '系统审核',
      render: (row) =>
        makePrimaryCell(row.moderationResult || '-', `${row.moderationProvider || '-'} / ${row.moderationRiskReason || '-'}`),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(row.createTime || '-', `状态：${getCommentStatusLabel(row.status, row.isVisible)} / 可见：${row.isVisible}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-comment-detail="${row.id}">详情</button>
          ${Number(row.status) === 0 ? `<button class="success" data-comment-pass="${row.id}">通过</button>` : ''}
          ${Number(row.status) !== 9 ? `<button class="warning" data-comment-reject="${row.id}">驳回</button>` : ''}
          ${Number(row.status) !== 9 ? `<button class="danger" data-comment-remove="${row.id}">删除</button>` : ''}
        </div>
      `,
    },
  ], list);
}

async function loadUsers() {
  const status = document.getElementById('users-status').value;
  const keyword = document.getElementById('users-keyword').value.trim();
  const list = await request(
    `/admin/users?status=${encodeURIComponent(status)}&keyword=${encodeURIComponent(keyword)}&limit=50`,
  );

  renderTable('users-table', [
    {
      label: '用户',
      render: (row) => makePrimaryCell(`#${row.id} ${row.nickName || '-'}`, `手机号：${row.phone || '-'} / 状态：${row.status}`),
    },
    {
      label: '活跃',
      render: (row) => makePrimaryCell(`积分 ${row.points}`, `帖子 ${row.topicCount} / 评论 ${row.commentCount}`),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(row.createTime || '-', `更新时间：${row.updateTime || '-'}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-user-detail="${row.id}">详情</button>
          ${Number(row.status) === 9
            ? `<button class="success" data-user-unban="${row.id}">解封</button>`
            : `<button class="danger" data-user-ban="${row.id}">封禁</button>`}
        </div>
      `,
    },
  ], list);
}

async function loadLogs() {
  const targetType = document.getElementById('logs-target-type').value.trim();
  const action = document.getElementById('logs-action').value.trim();
  const list = await request(
    `/admin/logs?targetType=${encodeURIComponent(targetType)}&action=${encodeURIComponent(action)}&limit=50`,
  );

  renderTable('logs-table', [
    {
      label: '日志',
      render: (row) => makePrimaryCell(`#${row.id} ${row.action}`, `管理员：${row.adminUsername || '-'} / 目标：${row.targetType}:${row.targetId}`),
    },
    {
      label: '备注',
      render: (row) => makePrimaryCell(row.remark || '-', JSON.stringify(row.extra || {})),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(row.createTime || '-', ''),
    },
  ], list);
}

async function loadRules() {
  const list = await request('/admin/rules');
  renderTable('rules-table', [
    {
      label: '关键词',
      render: (row) => makePrimaryCell(row.keyword, `${row.ruleType} / ${row.matchType}`),
    },
    {
      label: '状态',
      render: (row) => makePrimaryCell(row.status, row.remark || '-'),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(row.createTime || '-', `更新时间：${row.updateTime || '-'}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="danger" data-rule-delete="${row.id}">删除</button>
        </div>
      `,
    },
  ], list);
}

async function loadActiveView() {
  try {
    if (state.activeView === 'topics') {
      await loadTopics();
    } else if (state.activeView === 'comments') {
      await loadComments();
    } else if (state.activeView === 'users') {
      await loadUsers();
    } else if (state.activeView === 'logs') {
      await loadLogs();
    } else if (state.activeView === 'rules') {
      await loadRules();
    }
  } catch (error) {
    showMessage(error.message || '加载失败', 'error');
  }
}

async function withPromptAction(message, callback) {
  const remark = window.prompt(`${message}\n可填写备注，直接确定则留空。`, '') || '';
  await callback(remark.trim());
}

async function handleActionClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  try {
    if (target.dataset.topicDetail) {
      const data = await request(`/admin/review/topics/${target.dataset.topicDetail}`);
      openDrawer(`帖子详情 #${target.dataset.topicDetail}`, data);
      return;
    }

    if (target.dataset.commentDetail) {
      const data = await request(`/admin/review/comments/${target.dataset.commentDetail}`);
      openDrawer(`评论详情 #${target.dataset.commentDetail}`, data);
      return;
    }

    if (target.dataset.userDetail) {
      const data = await request(`/admin/users/${target.dataset.userDetail}`);
      openDrawer(`用户详情 #${target.dataset.userDetail}`, data);
      return;
    }

    if (target.dataset.topicPass) {
      await withPromptAction('确认通过该帖子？', async (remark) => {
        await request(`/admin/review/topics/${target.dataset.topicPass}/pass`, { method: 'POST', body: { remark } });
      });
      showMessage('帖子已通过');
      await loadTopics();
      return;
    }

    if (target.dataset.topicReject) {
      await withPromptAction('确认驳回该帖子？', async (remark) => {
        await request(`/admin/review/topics/${target.dataset.topicReject}/reject`, { method: 'POST', body: { remark } });
      });
      showMessage('帖子已驳回');
      await loadTopics();
      return;
    }

    if (target.dataset.topicRemove) {
      await withPromptAction('确认下架该帖子？', async (remark) => {
        await request(`/admin/review/topics/${target.dataset.topicRemove}/remove`, { method: 'POST', body: { remark } });
      });
      showMessage('帖子已下架');
      await loadTopics();
      return;
    }

    if (target.dataset.topicRestore) {
      await withPromptAction('确认恢复显示该帖子？', async (remark) => {
        await request(`/admin/review/topics/${target.dataset.topicRestore}/restore`, { method: 'POST', body: { remark } });
      });
      showMessage('帖子已恢复显示');
      await loadTopics();
      return;
    }

    if (target.dataset.commentPass) {
      await withPromptAction('确认通过该评论？', async (remark) => {
        await request(`/admin/review/comments/${target.dataset.commentPass}/pass`, { method: 'POST', body: { remark } });
      });
      showMessage('评论已通过');
      await loadComments();
      return;
    }

    if (target.dataset.commentReject) {
      await withPromptAction('确认驳回该评论？', async (remark) => {
        await request(`/admin/review/comments/${target.dataset.commentReject}/reject`, { method: 'POST', body: { remark } });
      });
      showMessage('评论已驳回');
      await loadComments();
      return;
    }

    if (target.dataset.commentRemove) {
      await withPromptAction('确认删除该评论？', async (remark) => {
        await request(`/admin/review/comments/${target.dataset.commentRemove}/remove`, { method: 'POST', body: { remark } });
      });
      showMessage('评论已删除');
      await loadComments();
      return;
    }

    if (target.dataset.userBan) {
      await withPromptAction('确认封禁该用户？', async (remark) => {
        await request(`/admin/users/${target.dataset.userBan}/ban`, { method: 'POST', body: { remark } });
      });
      showMessage('用户已封禁');
      await loadUsers();
      return;
    }

    if (target.dataset.userUnban) {
      await withPromptAction('确认解封该用户？', async (remark) => {
        await request(`/admin/users/${target.dataset.userUnban}/unban`, { method: 'POST', body: { remark } });
      });
      showMessage('用户已解封');
      await loadUsers();
      return;
    }

    if (target.dataset.ruleDelete) {
      if (!window.confirm('确认删除该规则？')) {
        return;
      }
      await request(`/admin/rules/${target.dataset.ruleDelete}`, { method: 'DELETE' });
      showMessage('规则已删除');
      await loadRules();
    }
  } catch (error) {
    showMessage(error.message || '操作失败', 'error');
  }
}

async function submitLogin(event) {
  event.preventDefault();
  el.loginError.classList.add('hidden');

  try {
    const data = await request('/admin/auth/login', {
      method: 'POST',
      body: {
        username: el.loginUsername.value.trim(),
        password: el.loginPassword.value,
      },
    });

    setAuth(data.token, data.adminUser);
    switchScreen(true);
    setActiveView('topics');
  } catch (error) {
    el.loginError.textContent = error.message || '登录失败';
    el.loginError.classList.remove('hidden');
  }
}

async function restoreSession() {
  if (!state.token) {
    switchScreen(false);
    return;
  }

  try {
    const adminUser = await request('/admin/auth/me');
    setAuth(state.token, adminUser);
    switchScreen(true);
    setActiveView('topics');
  } catch (_error) {
    setAuth('', null);
    switchScreen(false);
  }
}

async function createRule() {
  const keyword = document.getElementById('rule-keyword').value.trim();
  const remark = document.getElementById('rule-remark').value.trim();
  if (!keyword) {
    showMessage('请先输入黑名单词', 'error');
    return;
  }

  try {
    await request('/admin/rules', {
      method: 'POST',
      body: { keyword, remark },
    });
    document.getElementById('rule-keyword').value = '';
    document.getElementById('rule-remark').value = '';
    showMessage('规则已新增');
    await loadRules();
  } catch (error) {
    showMessage(error.message || '新增规则失败', 'error');
  }
}

el.loginForm.addEventListener('submit', submitLogin);
el.refreshButton.addEventListener('click', () => loadActiveView());
el.logoutButton.addEventListener('click', async () => {
  try {
    if (state.token) {
      await request('/admin/auth/logout', { method: 'POST' });
    }
  } catch (_error) {
  } finally {
    setAuth('', null);
    switchScreen(false);
    closeDrawer();
  }
});

document.querySelectorAll('.nav-item').forEach((node) => {
  node.addEventListener('click', () => setActiveView(node.dataset.view));
});

document.getElementById('topics-search').addEventListener('click', loadTopics);
document.getElementById('comments-search').addEventListener('click', loadComments);
document.getElementById('users-search').addEventListener('click', loadUsers);
document.getElementById('logs-search').addEventListener('click', loadLogs);
document.getElementById('rule-create').addEventListener('click', createRule);
document.body.addEventListener('click', handleActionClick);
el.drawerClose.addEventListener('click', closeDrawer);
el.drawer.addEventListener('click', (event) => {
  if (event.target === el.drawer) {
    closeDrawer();
  }
});

restoreSession();
