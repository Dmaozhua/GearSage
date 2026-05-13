const state = {
  token: localStorage.getItem('admin_token') || '',
  adminUser: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  activeView: 'topics',
};

const viewMeta = {
  topics: {
    title: '帖子审核与下架',
    subtitle: '查看待审核和已发布帖子；已发布内容可从这里下架，必要时可恢复显示。',
  },
  comments: {
    title: '评论审核',
    subtitle: '承接评论待审与人工复核动作。',
  },
  reports: {
    title: '举报处理',
    subtitle: '查看用户举报，处理帖子、评论和用户相关投诉。',
  },
  'gear-feedback': {
    title: '装备反馈',
    subtitle: '审核用户提交的装备库资料错误、补充信息与权利问题反馈。',
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

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const pad = (number) => String(number).padStart(2, '0');
  return [
    `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
}

function isDateLikeFieldKey(key) {
  return /(?:Time|At)$/i.test(String(key || ''));
}

function formatJsonValueForDisplay(value, key = '') {
  if (Array.isArray(value)) {
    return value.map((item) => formatJsonValueForDisplay(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        formatJsonValueForDisplay(childValue, childKey),
      ]),
    );
  }

  if (typeof value === 'string' && isDateLikeFieldKey(key)) {
    return formatDateTime(value);
  }

  return value;
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
  if (normalized === 2) return '已发布';
  if (normalized === 9) return '已驳回/下架';
  if (normalized === 0) return '草稿';
  return String(status ?? '-');
}

function getCommentStatusLabel(status, isVisible) {
  const normalized = Number(status || 0);
  if (normalized === 0) return '待审核';
  if (normalized === 2) return '已展示';
  if (normalized === 9) return Number(isVisible || 0) === 1 ? '已驳回' : '已驳回/删除';
  return String(status ?? '-');
}

function getUserStatusLabel(status) {
  const normalized = Number(status || 0);
  if (normalized === 0) return '正常';
  if (normalized === 9) return '已封禁';
  return String(status ?? '-');
}

function getReportStatusLabel(status) {
  const normalized = String(status || '').trim();
  if (normalized === 'pending') return '待处理';
  if (normalized === 'handled') return '已处理';
  if (normalized === 'rejected') return '已驳回';
  return normalized || '-';
}

function getReportTargetLabel(targetType) {
  const normalized = String(targetType || '').trim();
  if (normalized === 'topic') return '帖子';
  if (normalized === 'comment') return '评论';
  if (normalized === 'user') return '用户';
  if (normalized === 'report') return '举报';
  if (normalized === 'gear_feedback') return '装备反馈';
  if (normalized === 'moderation_rule') return '关键词规则';
  return normalized || '-';
}

function getAdminActionMeta(action) {
  const normalized = String(action || '').trim();
  const actionMap = {
    topic_pass: ['通过帖子', '帖子审核通过并发布'],
    topic_reject: ['驳回帖子', '帖子未通过，退回草稿'],
    topic_remove: ['下架帖子', '帖子被隐藏，不再对用户展示'],
    topic_restore: ['恢复帖子', '帖子恢复为已发布状态'],
    comment_pass: ['通过评论', '评论审核通过并展示'],
    comment_reject: ['驳回评论', '评论未通过，不对外展示'],
    comment_remove: ['隐藏评论', '评论被下架，不再对外展示'],
    report_accept: ['认可举报', '举报成立，并联动处理被举报对象'],
    report_handle: ['标记举报已处理', '举报已人工处理但未联动下架对象'],
    report_reject: ['驳回举报', '举报不成立或无需处理'],
    gear_feedback_handle: ['处理装备反馈', '装备库反馈已人工核查处理'],
    gear_feedback_reject: ['驳回装备反馈', '装备库反馈无效或暂不处理'],
    user_ban: ['封禁用户', '用户被禁止继续正常使用'],
    user_unban: ['解封用户', '用户恢复正常状态'],
    rule_create: ['新增关键词规则', '后台新增内容审核关键词'],
    rule_delete: ['删除关键词规则', '后台删除内容审核关键词'],
  };
  const matched = actionMap[normalized];
  if (matched) {
    return {
      label: matched[0],
      description: matched[1],
      code: normalized,
    };
  }
  return {
    label: normalized || '-',
    description: normalized ? '未配置中文说明的后台动作' : '',
    code: normalized,
  };
}

function getLogStatusLabel(status) {
  const normalized = String(status || '').trim();
  if (normalized === 'handled') return '已处理';
  if (normalized === 'rejected') return '已驳回';
  if (normalized === 'pending') return '待处理';
  if (normalized === 'active') return '启用';
  if (normalized === 'inactive') return '停用';
  return normalized || '';
}

function getLogSourceLabel(source) {
  const normalized = String(source || '').trim();
  if (normalized === 'report_accept') return '认可举报';
  return normalized || '';
}

function formatLogIdList(value) {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .map((item) => `#${item}`)
    .join('、');
}

function formatLogTarget(type, id) {
  const targetType = String(type || '').trim();
  const targetId = String(id ?? '').trim();
  if (!targetType && !targetId) return '';
  return `${getReportTargetLabel(targetType)}${targetId ? ` #${targetId}` : ''}`;
}

function buildLogExtraSummary(extra = {}) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
    return '';
  }

  const parts = [];
  if (extra.reportStatus) {
    parts.push(`举报状态：${getLogStatusLabel(extra.reportStatus) || extra.reportStatus}`);
  }
  if (extra.targetType || extra.targetId) {
    parts.push(`处理对象：${formatLogTarget(extra.targetType, extra.targetId)}`);
  }
  if (extra.reportId) {
    parts.push(`关联举报：#${extra.reportId}`);
  }
  if (extra.gearType || extra.masterId || extra.variantId) {
    parts.push([
      extra.gearType ? `装备类别：${extra.gearType}` : '',
      extra.masterId ? `主 ID：${extra.masterId}` : '',
      extra.variantId ? `子型号：${extra.variantId}` : '',
    ].filter(Boolean).join(' / '));
  }
  if (extra.feedbackType) {
    parts.push(`反馈类型：${extra.feedbackType}`);
  }
  if (extra.topicId) {
    parts.push(`所属帖子：#${extra.topicId}`);
  }
  if (extra.hiddenCommentIds && Array.isArray(extra.hiddenCommentIds) && extra.hiddenCommentIds.length) {
    parts.push(`隐藏评论：${formatLogIdList(extra.hiddenCommentIds)}`);
  }
  if (extra.hiddenVisibleCount !== undefined) {
    parts.push(`影响可见评论：${extra.hiddenVisibleCount} 条`);
  }
  if (extra.topicStatus !== undefined) {
    parts.push(`帖子状态：${getTopicStatusLabel(extra.topicStatus)}`);
  }
  if (extra.userStatus !== undefined) {
    parts.push(`用户状态：${getUserStatusLabel(extra.userStatus)}`);
  }
  if (extra.previousStatus !== undefined) {
    parts.push(`原用户状态：${getUserStatusLabel(extra.previousStatus)}`);
  }
  if (extra.isDelete !== undefined) {
    parts.push(`删除标记：${Number(extra.isDelete || 0) === 1 ? '已下架' : '未下架'}`);
  }
  if (extra.source) {
    parts.push(`来源：${getLogSourceLabel(extra.source) || extra.source}`);
  }
  if (extra.keyword) {
    parts.push(`关键词：${extra.keyword}`);
  }
  if (extra.ruleType || extra.matchType || extra.status) {
    parts.push([
      extra.ruleType ? `类型：${extra.ruleType}` : '',
      extra.matchType ? `匹配：${extra.matchType}` : '',
      extra.status ? `状态：${getLogStatusLabel(extra.status) || extra.status}` : '',
    ].filter(Boolean).join(' / '));
  }

  return parts.filter(Boolean).join(' · ');
}

function buildLogCellSubtitle(row) {
  const actionMeta = getAdminActionMeta(row.action);
  const parts = [
    actionMeta.description,
    `操作人：${row.adminUsername || '-'}`,
    `目标：${formatLogTarget(row.targetType, row.targetId)}`,
    `动作码：${row.action || '-'}`,
  ];
  const extraSummary = buildLogExtraSummary(row.extra || {});
  if (extraSummary) {
    parts.push(extraSummary);
  }
  return parts.filter(Boolean).join(' · ');
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

  const displayValue = typeof value === 'string' ? value : formatJsonValueForDisplay(value);
  const text = typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue, null, 2);
  return `
    <section class="drawer-section">
      <h4>${escapeHtml(title)}</h4>
      <pre class="json-block">${escapeHtml(text)}</pre>
    </section>
  `;
}

function formatReviewValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
      .filter(Boolean)
      .join('、');
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? '');
}

function renderReviewFields(title, rows = []) {
  const normalized = rows
    .map((row) => ({
      label: row && row.label,
      value: formatReviewValue(row && row.value),
    }))
    .filter((row) => row.label && row.value);

  return renderKeyValueSection(title, normalized);
}

function renderReadableRows(title, rows = []) {
  const normalized = rows
    .map((row) => ({
      label: row && row.label,
      value: formatReviewValue(row && row.value),
    }))
    .filter((row) => row.label && row.value);
  if (!normalized.length) {
    return '';
  }

  const isBodySection = title === '正文' && normalized.length === 1;
  return `
    <section class="drawer-section readable-section">
      <h4>${escapeHtml(title)}</h4>
      ${isBodySection
        ? `<div class="readable-body-text">${escapeHtml(normalized[0].value)}</div>`
        : `<div class="readable-row-list">
          ${normalized.map((row) => `
            <div class="readable-row">
              <div class="readable-label">${escapeHtml(row.label)}</div>
              <div class="readable-value">${escapeHtml(row.value)}</div>
            </div>
          `).join('')}
        </div>`}
    </section>
  `;
}

function renderTopicReviewSections(sections = []) {
  const normalized = Array.isArray(sections)
    ? sections.filter((section) => section && section.title !== '帖子概览')
    : [];
  if (!normalized.length) {
    return '';
  }

  return normalized
    .map((section) => renderReadableRows(section.title || '已填写内容', section.rows || []))
    .join('');
}

function renderReportTopicBlock(topic) {
  if (!topic) {
    return '';
  }

  return `
    <section class="drawer-section report-topic-summary">
      <div class="report-topic-kicker">被举报帖子 · ${escapeHtml(topic.topicCategoryLabel || '-')}</div>
      <div class="report-topic-title">${escapeHtml(topic.title || '无标题')}</div>
      <div class="report-topic-meta">
        <span>ID ${escapeHtml(topic.id)}</span>
        <span>${escapeHtml(topic.authorName || '-')}</span>
        <span>${escapeHtml(topic.authorPhone || '-')}</span>
        <span>${escapeHtml(getTopicStatusLabel(topic.status))} / isDelete=${escapeHtml(topic.isDelete)}</span>
      </div>
      <div class="report-topic-stats">
        <span>点赞 ${escapeHtml(topic.likeCount || 0)}</span>
        <span>评论 ${escapeHtml(topic.commentCount || 0)}</span>
        <span>发布 ${escapeHtml(formatDateTime(topic.publishTime))}</span>
        <span>创建 ${escapeHtml(formatDateTime(topic.createTime))}</span>
      </div>
    </section>
    ${renderTopicReviewSections(topic.reviewSections || [])}
    <section class="drawer-section">
      <h4>帖子图片</h4>
      ${renderMediaPreview(topic.images || [])}
    </section>
  `;
}

function renderReportUserBlock(user) {
  if (!user) {
    return '';
  }

  return `
    <section class="drawer-section report-topic-summary">
      <div class="report-topic-kicker">被举报用户 · ${escapeHtml(user.statusLabel || getUserStatusLabel(user.status))}</div>
      <div class="report-topic-title">${escapeHtml(user.nickName || '未设置昵称')}</div>
      <div class="report-topic-meta">
        <span>用户 ID ${escapeHtml(user.id)}</span>
        <span>手机号 ${escapeHtml(user.phone || '-')}</span>
        <span>等级 ${escapeHtml(user.level || 1)}</span>
        <span>积分 ${escapeHtml(user.points || 0)}</span>
      </div>
      <div class="report-topic-stats">
        <span>发帖 ${escapeHtml(user.topicCount || 0)}</span>
        <span>已发布 ${escapeHtml(user.publishedTopicCount || 0)}</span>
        <span>待审核 ${escapeHtml(user.pendingTopicCount || 0)}</span>
        <span>下架/驳回 ${escapeHtml(user.removedTopicCount || 0)}</span>
        <span>评论 ${escapeHtml(user.commentCount || 0)}</span>
        <span>收到举报 ${escapeHtml(user.receivedReportCount || 0)}</span>
      </div>
    </section>
    ${renderKeyValueSection('被举报用户资料', [
      { label: '昵称', value: user.nickName || '-' },
      { label: '手机号', value: user.phone || '-' },
      { label: '账号状态', value: user.statusLabel || getUserStatusLabel(user.status) },
      { label: '用户 ID', value: user.id },
      { label: '是否后台管理员', value: user.isAdmin ? '是' : '否' },
      { label: '邀请码', value: user.inviteCode || '-' },
      { label: '邀请人 ID', value: user.invitedByUserId || '-' },
      { label: '成功邀请数', value: user.inviteSuccessCount || 0 },
      { label: '邀请奖励积分', value: user.inviteRewardPoints || 0 },
      { label: '创建时间', value: formatDateTime(user.createTime) },
      { label: '更新时间', value: formatDateTime(user.updateTime) },
    ])}
    ${renderReadableRows('被举报用户简介', [
      { label: '个人简介', value: user.bio || '未填写' },
    ])}
    ${renderKeyValueSection('被举报用户内容与举报统计', [
      { label: '发帖总数', value: user.topicCount || 0 },
      { label: '已发布帖子', value: user.publishedTopicCount || 0 },
      { label: '待审核帖子', value: user.pendingTopicCount || 0 },
      { label: '下架/驳回帖子', value: user.removedTopicCount || 0 },
      { label: '评论总数', value: user.commentCount || 0 },
      { label: '可见评论', value: user.visibleCommentCount || 0 },
      { label: '收到举报总数', value: user.receivedReportCount || 0 },
      { label: '待处理举报', value: user.pendingReportCount || 0 },
    ])}
    <section class="drawer-section">
      <h4>用户图片</h4>
      ${renderMediaPreview([user.avatarUrl, user.background].filter(Boolean))}
    </section>
  `;
}

function renderTopicDetail(data) {
  return `
    <section class="drawer-section report-topic-summary">
      <div class="report-topic-kicker">审核帖子 · ${escapeHtml(data.topicCategoryLabel || '-')}</div>
      <div class="report-topic-title">${escapeHtml(data.title || '无标题')}</div>
      <div class="report-topic-meta">
        <span>ID ${escapeHtml(data.id)}</span>
        <span>${escapeHtml(data.authorName || '-')}</span>
        <span>${escapeHtml(data.authorPhone || '-')}</span>
        <span>${escapeHtml(getTopicStatusLabel(data.status))} / isDelete=${escapeHtml(data.isDelete || 0)}</span>
      </div>
      <div class="report-topic-stats">
        <span>点赞 ${escapeHtml(data.likeCount || 0)}</span>
        <span>评论 ${escapeHtml(data.commentCount || 0)}</span>
        <span>发布 ${escapeHtml(formatDateTime(data.publishTime))}</span>
        <span>创建 ${escapeHtml(formatDateTime(data.createTime))}</span>
      </div>
    </section>
    ${renderReadableRows('审核信号', [
      { label: '系统审核结果', value: data.moderationResult || '-' },
      { label: '风险原因', value: data.moderationRiskReason || '-' },
      { label: '风险等级', value: data.moderationRiskLevel || '-' },
      { label: '最近后台动作', value: data.latestAdminAction || '-' },
      { label: '最近处理备注', value: data.latestAdminRemark || '-' },
    ])}
    ${renderTopicReviewSections(data.reviewSections || [])}
    <section class="drawer-section">
      <h4>用户上传图片</h4>
      ${renderMediaPreview(data.images)}
    </section>
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
      { label: '创建时间', value: formatDateTime(data.createTime) },
      { label: '更新时间', value: formatDateTime(data.updateTime) },
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
      { label: '状态', value: getUserStatusLabel(data.status) },
      { label: '积分', value: data.points },
      { label: '帖子数', value: data.topicCount },
      { label: '评论数', value: data.commentCount },
      { label: '创建时间', value: formatDateTime(data.createTime) },
      { label: '更新时间', value: formatDateTime(data.updateTime) },
    ])}
    ${renderJsonBlock('原始数据', data)}
  `;
}

function renderReportDetail(data) {
  return `
    ${renderKeyValueSection('举报信息', [
      { label: '举报 ID', value: data.id },
      { label: '举报人', value: data.reporterName || '-' },
      { label: '举报人手机号', value: data.reporterPhone || '-' },
      { label: '对象', value: `${getReportTargetLabel(data.targetType)} #${data.targetId}` },
      { label: '被举报内容', value: data.targetContent || '-' },
      { label: '状态', value: getReportStatusLabel(data.status) },
      { label: '系统审核结果', value: data.moderationResult || '-' },
      { label: '风险原因', value: data.moderationRiskReason || '-' },
      { label: '处理备注', value: data.handledRemark || '-' },
      { label: '创建时间', value: formatDateTime(data.createTime) },
      { label: '处理时间', value: formatDateTime(data.handledAt) },
    ])}
    ${renderReportTopicBlock(data.targetTopic)}
    ${renderReportUserBlock(data.targetUser)}
    ${renderJsonBlock('举报理由', data.reason || '')}
    ${renderJsonBlock('审核记录', data.moderationRecords || [])}
    ${renderJsonBlock('后台日志', data.adminLogs || [])}
  `;
}

function getGearFeedbackStatusLabel(status) {
  return getReportStatusLabel(status);
}

function renderGearFeedbackUserIdentity(data) {
  const parts = [
    data.userName || '匿名用户',
    data.userId ? `用户ID ${data.userId}` : '',
    data.userPhone ? `手机号 ${data.userPhone}` : '',
  ].filter(Boolean);

  return parts.join(' · ');
}

function renderGearFeedbackChips(items = []) {
  return items
    .filter((item) => item && item.value)
    .map((item) => `
      <span class="gear-feedback-chip ${item.tone ? `gear-feedback-chip--${escapeAttr(item.tone)}` : ''}">
        ${escapeHtml(item.label ? `${item.label}：${item.value}` : item.value)}
      </span>
    `)
    .join('');
}

function renderGearFeedbackLocator(rows = []) {
  const normalized = rows.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '');
  if (!normalized.length) {
    return '';
  }

  return `
    <section class="drawer-section gear-feedback-locator">
      <div class="gear-feedback-section-head">
        <h4>装备定位与修正线索</h4>
        <span>后台使用，便于回到装备库数据源核查</span>
      </div>
      <div class="gear-feedback-locator-grid">
        ${normalized.map((row) => `
          <div class="gear-feedback-locator-item ${row.strong ? 'gear-feedback-locator-item--strong' : ''}">
            <div class="gear-feedback-locator-label">${escapeHtml(row.label)}</div>
            <div class="gear-feedback-locator-value">${escapeHtml(row.value)}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderGearFeedbackDetail(data) {
  const gear = data.gear || {};
  const variant = data.variant || {};
  const masterSnapshot = (data.extra && data.extra.master) || {};
  const gearName = gear.name || masterSnapshot.displayName || [gear.brandName || masterSnapshot.brandName, gear.model || masterSnapshot.model, gear.modelCn || masterSnapshot.modelCn]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join(' ');
  const fieldName = data.fieldLabel || data.fieldKey || '整体资料';
  const variantDisplay = [
    variant.sku ? `SKU ${variant.sku}` : '',
    variant.variantId ? `variantId ${variant.variantId}` : '',
    variant.sourceKey ? `sourceKey ${variant.sourceKey}` : '',
  ].filter(Boolean).join(' / ');

  return `
    <section class="drawer-section gear-feedback-hero">
      <div>
        <div class="gear-feedback-kicker">装备资料反馈 #${escapeHtml(data.id)}</div>
        <div class="gear-feedback-title">${escapeHtml(gearName || '未匹配装备名称')}</div>
        <div class="gear-feedback-subtitle">
          ${escapeHtml(data.gearTypeLabel || data.gearType || '-')}
          ${fieldName ? ` · ${escapeHtml(fieldName)}` : ''}
        </div>
      </div>
      <div class="gear-feedback-chip-row">
        ${renderGearFeedbackChips([
          { label: '状态', value: getGearFeedbackStatusLabel(data.status), tone: 'status' },
          { label: '类型', value: data.feedbackType || '-' },
          { label: '提交', value: formatDateTime(data.createTime) },
        ])}
      </div>
    </section>

    <section class="drawer-section gear-feedback-card">
      <div class="gear-feedback-section-head">
        <h4>用户反馈内容</h4>
        <span>${escapeHtml(renderGearFeedbackUserIdentity(data))}</span>
      </div>
      <div class="gear-feedback-body">${escapeHtml(data.content || '-')}</div>
      <div class="gear-feedback-signal-row">
        <span>系统审核：${escapeHtml(data.moderationResult || '-')}</span>
        <span>风险原因：${escapeHtml(data.moderationRiskReason || '-')}</span>
        ${data.handledRemark ? `<span>处理备注：${escapeHtml(data.handledRemark)}</span>` : ''}
      </div>
    </section>

    ${renderGearFeedbackLocator([
      { label: '装备类别', value: data.gearTypeLabel || data.gearType || '-', strong: true },
      { label: 'masterId', value: data.masterId || '-', strong: true },
      { label: 'variantId', value: data.variantId || '' },
      { label: '装备名称', value: gearName || '-' },
      { label: '品牌', value: gear.brandName || masterSnapshot.brandName || '-' },
      { label: '型号', value: gear.model || masterSnapshot.model || '-' },
      { label: '中文型号', value: gear.modelCn || masterSnapshot.modelCn || '-' },
      { label: '年份', value: gear.modelYear || masterSnapshot.modelYear || '-' },
      { label: '匹配子型号', value: variantDisplay },
      { label: 'variant sourceKey', value: variant.sourceKey || '' },
      { label: 'variant gearId', value: variant.gearId || '' },
    ])}

    <section class="drawer-section">
      <h4>反馈图片</h4>
      ${renderMediaPreview(data.images || [])}
    </section>
    ${renderJsonBlock('装备原始数据', gear.rawJson || null)}
    ${renderJsonBlock('子型号原始数据', variant.rawJson || null)}
    ${renderJsonBlock('审核记录', data.moderationRecords || [])}
    ${renderJsonBlock('后台日志', data.adminLogs || [])}
  `;
}

function renderDrawerContent(data) {
  if (data && Object.prototype.hasOwnProperty.call(data, 'feedbackType') && Object.prototype.hasOwnProperty.call(data, 'masterId')) {
    return renderGearFeedbackDetail(data);
  }

  if (data && Array.isArray(data.moderationRecords) && Array.isArray(data.adminLogs) && Object.prototype.hasOwnProperty.call(data, 'images')) {
    return renderTopicDetail(data);
  }

  if (data && Array.isArray(data.moderationRecords) && Array.isArray(data.adminLogs) && Object.prototype.hasOwnProperty.call(data, 'topicTitle')) {
    return renderCommentDetail(data);
  }

  if (data && Object.prototype.hasOwnProperty.call(data, 'points') && Object.prototype.hasOwnProperty.call(data, 'phone')) {
    return renderUserDetail(data);
  }

  if (data && Object.prototype.hasOwnProperty.call(data, 'reporterUserId') && Object.prototype.hasOwnProperty.call(data, 'reason')) {
    return renderReportDetail(data);
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
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), `更新时间：${formatDateTime(row.updateTime)}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-topic-detail="${row.id}">详情</button>
          ${Number(row.status) === 1 ? `<button class="success" data-topic-pass="${row.id}">通过</button>` : ''}
          ${Number(row.status) === 1 ? `<button class="warning" data-topic-reject="${row.id}">驳回</button>` : ''}
          ${Number(row.status) === 2 ? `<button class="danger" data-topic-remove="${row.id}">下架已发布帖子</button>` : ''}
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
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), `状态：${getCommentStatusLabel(row.status, row.isVisible)} / 可见：${row.isVisible}`),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-comment-detail="${row.id}">详情</button>
          ${Number(row.status) === 0 ? `<button class="success" data-comment-pass="${row.id}">通过</button>` : ''}
          ${Number(row.status) !== 9 ? `<button class="warning" data-comment-reject="${row.id}">驳回</button>` : ''}
          ${Number(row.status) !== 9 ? `<button class="danger" data-comment-remove="${row.id}">隐藏评论</button>` : ''}
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
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), `更新时间：${formatDateTime(row.updateTime)}`),
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

async function loadReports() {
  const status = document.getElementById('reports-status').value;
  const targetType = document.getElementById('reports-target-type').value;
  const list = await request(
    `/admin/reports?status=${encodeURIComponent(status)}&targetType=${encodeURIComponent(targetType)}&limit=50`,
  );

  renderTable('reports-table', [
    {
      label: '举报',
      render: (row) => makePrimaryCell(
        `#${row.id} ${getReportTargetLabel(row.targetType)} #${row.targetId}`,
        `举报人：${row.reporterName || '-'} / 状态：${getReportStatusLabel(row.status)}`,
      ),
    },
    {
      label: '被举报内容',
      render: (row) => {
        if (row.targetTopic) {
          return makePrimaryCell(
            row.targetTopic.title || `帖子 #${row.targetTopic.id}`,
            [
              row.targetTopic.content ? row.targetTopic.content.slice(0, 80) : '',
              `状态：${getTopicStatusLabel(row.targetTopic.status)} / 作者：${row.targetTopic.authorName || '-'}`,
            ].filter(Boolean).join(' / '),
          );
        }
        if (row.targetUser) {
          return makePrimaryCell(
            row.targetUser.nickName || `用户 #${row.targetUser.id}`,
            [
              `手机号：${row.targetUser.phone || '-'}`,
              `状态：${row.targetUser.statusLabel || getUserStatusLabel(row.targetUser.status)}`,
              `发帖：${row.targetUser.topicCount || 0}`,
              `评论：${row.targetUser.commentCount || 0}`,
              `收到举报：${row.targetUser.receivedReportCount || 0}`,
            ].join(' / '),
          );
        }
        return makePrimaryCell(row.targetContent || '-', row.targetType === 'comment' ? '评论正文' : '');
      },
    },
    {
      label: '理由',
      render: (row) => makePrimaryCell(row.reason || '-', `${row.moderationProvider || '-'} / ${row.moderationRiskReason || '-'}`),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), row.handledAt ? `处理：${formatDateTime(row.handledAt)}` : ''),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-report-detail="${row.id}">详情</button>
          ${String(row.status) === 'pending' && String(row.targetType) === 'comment' ? `<button class="danger" data-report-accept-comment="${row.id}">认可并隐藏评论</button>` : ''}
          ${String(row.status) === 'pending' && String(row.targetType) === 'topic' ? `<button class="danger" data-report-accept-topic="${row.id}">认可并下架帖子</button>` : ''}
          ${String(row.status) === 'pending' && String(row.targetType) === 'user' ? `<button class="danger" data-report-accept-user="${row.id}">认可并封禁用户</button>` : ''}
          ${String(row.status) === 'pending' ? `<button class="success" data-report-handle="${row.id}">标记处理</button>` : ''}
          ${String(row.status) === 'pending' ? `<button class="warning" data-report-reject="${row.id}">驳回举报</button>` : ''}
        </div>
      `,
    },
  ], list);
}

async function loadGearFeedback() {
  const status = document.getElementById('gear-feedback-status').value;
  const gearType = document.getElementById('gear-feedback-type').value;
  const feedbackType = document.getElementById('gear-feedback-feedback-type').value;
  const list = await request(
    `/admin/gear-feedback?status=${encodeURIComponent(status)}&gearType=${encodeURIComponent(gearType)}&feedbackType=${encodeURIComponent(feedbackType)}&limit=50`,
  );

  renderTable('gear-feedback-table', [
    {
      label: '反馈',
      render: (row) => makePrimaryCell(
        `#${row.id} ${row.feedbackType || '-'}`,
        [
          `提交人：${row.userName || '-'}`,
          row.userId ? `用户ID：${row.userId}` : '',
          row.userPhone ? `手机号：${row.userPhone}` : '',
          `状态：${getGearFeedbackStatusLabel(row.status)}`,
        ].filter(Boolean).join(' / '),
      ),
    },
    {
      label: '装备定位',
      render: (row) => makePrimaryCell(
        row.gear && row.gear.name ? row.gear.name : `${row.gearTypeLabel || row.gearType || '-'} ${row.masterId || '-'}`,
        [
          `${row.gearTypeLabel || row.gearType || '-'} / masterId：${row.masterId || '-'}`,
          row.variantId ? `variantId：${row.variantId}` : '',
          row.fieldLabel ? `字段：${row.fieldLabel}` : '',
        ].filter(Boolean).join(' / '),
      ),
    },
    {
      label: '内容',
      render: (row) => makePrimaryCell(
        row.content || '-',
        `${row.moderationProvider || '-'} / ${row.moderationRiskReason || '-'}`,
      ),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), row.handledAt ? `处理：${formatDateTime(row.handledAt)}` : ''),
    },
    {
      label: '操作',
      render: (row) => `
        <div class="action-row">
          <button class="secondary" data-gear-feedback-detail="${row.id}">详情</button>
          ${String(row.status) === 'pending' ? `<button class="success" data-gear-feedback-handle="${row.id}">标记处理</button>` : ''}
          ${String(row.status) === 'pending' ? `<button class="warning" data-gear-feedback-reject="${row.id}">驳回反馈</button>` : ''}
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
      render: (row) => {
        const actionMeta = getAdminActionMeta(row.action);
        return makePrimaryCell(`#${row.id} ${actionMeta.label}`, buildLogCellSubtitle(row));
      },
    },
    {
      label: '备注',
      render: (row) => makePrimaryCell(row.remark || '无备注', buildLogExtraSummary(row.extra || {}) || '无补充信息'),
    },
    {
      label: '时间',
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), ''),
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
      render: (row) => makePrimaryCell(formatDateTime(row.createTime), `更新时间：${formatDateTime(row.updateTime)}`),
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
    } else if (state.activeView === 'reports') {
      await loadReports();
    } else if (state.activeView === 'gear-feedback') {
      await loadGearFeedback();
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

    if (target.dataset.reportDetail) {
      const data = await request(`/admin/reports/${target.dataset.reportDetail}`);
      openDrawer(`举报详情 #${target.dataset.reportDetail}`, data);
      return;
    }

    if (target.dataset.gearFeedbackDetail) {
      const data = await request(`/admin/gear-feedback/${target.dataset.gearFeedbackDetail}`);
      openDrawer(`装备反馈 #${target.dataset.gearFeedbackDetail}`, data);
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
      await withPromptAction('确认下架该已发布帖子？下架后前端不可见，可在“已驳回/下架”中恢复显示。', async (remark) => {
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
      await withPromptAction('确认隐藏该评论？隐藏后前端不可见。', async (remark) => {
        await request(`/admin/review/comments/${target.dataset.commentRemove}/remove`, { method: 'POST', body: { remark } });
      });
      showMessage('评论已隐藏');
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

    if (target.dataset.reportHandle) {
      await withPromptAction('确认该举报已处理？', async (remark) => {
        await request(`/admin/reports/${target.dataset.reportHandle}/handle`, { method: 'POST', body: { remark } });
      });
      showMessage('举报已处理');
      await loadReports();
      return;
    }

    if (target.dataset.reportAcceptComment) {
      await withPromptAction('确认认可该举报，并隐藏被举报评论及其回复？', async (remark) => {
        await request(`/admin/reports/${target.dataset.reportAcceptComment}/accept-comment`, { method: 'POST', body: { remark } });
      });
      showMessage('举报已认可，评论已隐藏');
      await loadReports();
      return;
    }

    if (target.dataset.reportAcceptTopic) {
      await withPromptAction('确认认可该举报，并下架被举报帖子？', async (remark) => {
        await request(`/admin/reports/${target.dataset.reportAcceptTopic}/accept-topic`, { method: 'POST', body: { remark } });
      });
      showMessage('举报已认可，帖子已下架');
      await loadReports();
      return;
    }

    if (target.dataset.reportAcceptUser) {
      await withPromptAction('确认认可该举报，并封禁被举报用户？', async (remark) => {
        await request(`/admin/reports/${target.dataset.reportAcceptUser}/accept-user`, { method: 'POST', body: { remark } });
      });
      showMessage('举报已认可，用户已封禁');
      await loadReports();
      return;
    }

    if (target.dataset.reportReject) {
      await withPromptAction('确认驳回该举报？', async (remark) => {
        await request(`/admin/reports/${target.dataset.reportReject}/reject`, { method: 'POST', body: { remark } });
      });
      showMessage('举报已驳回');
      await loadReports();
      return;
    }

    if (target.dataset.gearFeedbackHandle) {
      await withPromptAction('确认该装备反馈已处理？', async (remark) => {
        await request(`/admin/gear-feedback/${target.dataset.gearFeedbackHandle}/handle`, { method: 'POST', body: { remark } });
      });
      showMessage('装备反馈已处理');
      await loadGearFeedback();
      return;
    }

    if (target.dataset.gearFeedbackReject) {
      await withPromptAction('确认驳回该装备反馈？', async (remark) => {
        await request(`/admin/gear-feedback/${target.dataset.gearFeedbackReject}/reject`, { method: 'POST', body: { remark } });
      });
      showMessage('装备反馈已驳回');
      await loadGearFeedback();
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
document.getElementById('reports-search').addEventListener('click', loadReports);
document.getElementById('gear-feedback-search').addEventListener('click', loadGearFeedback);
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
