// utils/richTextFormatter.js
// 将后端返回的内容（字符串、JSON 字符串或对象）转换为可在小程序 rich-text 中渲染的节点

function formatRichTextContent(content) {
  return parseRichTextPayload(content).html;
}

function parseRichTextPayload(content) {
  const { text, subQuestion } = extractStructuredContent(content);
  const html = buildHtmlFromPlainText(text);
  return {
    text,
    html,
    subQuestion
  };
}

function extractStructuredContent(source) {
  if (source === null || typeof source === 'undefined') {
    return { text: '', subQuestion: '' };
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      return { text: '', subQuestion: '' };
    }

    if (isJsonLike(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractStructuredContent(parsed);
      } catch (error) {
        // 非 JSON 字符串，直接当作文本处理
        return { text: trimmed, subQuestion: '' };
      }
    }

    return { text: trimmed, subQuestion: '' };
  }

  if (typeof source === 'number' || typeof source === 'boolean') {
    return { text: String(source), subQuestion: '' };
  }

  if (Array.isArray(source)) {
    return mergeContentParts(source);
  }

  if (typeof source === 'object') {
    const subQuestion = typeof source.subQuestion === 'string' ? source.subQuestion : '';

    const candidateKeys = [
      'html',
      'contentHtml',
      'richText',
      'content',
      'text',
      'value'
    ];

    for (const key of candidateKeys) {
      if (typeof source[key] === 'string' && source[key].trim()) {
        const nested = extractStructuredContent(source[key]);
        return {
          text: nested.text,
          subQuestion: subQuestion || nested.subQuestion
        };
      }
    }

    if (Array.isArray(source.ops)) {
      const parts = source.ops.map(op => {
        if (op && typeof op.insert === 'string') {
          return op.insert;
        }
        return '';
      });
      const merged = mergeContentParts(parts);
      return {
        text: merged.text,
        subQuestion: subQuestion || merged.subQuestion
      };
    }

    if (Array.isArray(source.delta)) {
      return extractStructuredContent({ ops: source.delta, subQuestion });
    }

    return {
      text: '',
      subQuestion
    };
  }

  return { text: '', subQuestion: '' };
}

function mergeContentParts(parts) {
  const textSegments = [];
  let subQuestion = '';

  parts.forEach(part => {
    const segment = extractStructuredContent(part);
    if (segment.text) {
      textSegments.push(segment.text);
    }
    if (!subQuestion && segment.subQuestion) {
      subQuestion = segment.subQuestion;
    }
  });

  return {
    text: textSegments.join(''),
    subQuestion
  };
}

function buildHtmlFromPlainText(text) {
  if (!text) {
    return '';
  }

  const normalised = text.replace(/\r\n?/g, '\n');
  const lines = normalised.split('\n');

  const htmlParts = lines.map(line => {
    if (!line) {
      return '<p><br/></p>';
    }
    const escaped = escapeHtml(line);
    return `<p>${preserveSpacing(escaped)}</p>`;
  });

  return htmlParts.join('');
}

function preserveSpacing(text) {
  if (!text) {
    return '';
  }

  let result = text.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

  const leadingSpaces = result.match(/^ +/);
  if (leadingSpaces) {
    const replacement = '&nbsp;'.repeat(leadingSpaces[0].length);
    result = replacement + result.slice(leadingSpaces[0].length);
  }

  result = result.replace(/ {2,}/g, spaces => '&nbsp;'.repeat(spaces.length));

  const trailingSpaces = result.match(/ +$/);
  if (trailingSpaces) {
    const replacement = '&nbsp;'.repeat(trailingSpaces[0].length);
    result = result.slice(0, result.length - trailingSpaces[0].length) + replacement;
  }

  return result;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isJsonLike(value) {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

module.exports = {
  formatRichTextContent,
  parseRichTextPayload
};
