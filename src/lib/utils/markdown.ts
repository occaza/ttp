/**
 * Renderer & sanitizer konten CMS (mendukung Rich Text HTML maupun Markdown).
 * Mencegah XSS dengan membersihkan tag/atribut berbahaya sebelum dirender.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatInline(escaped: string): string {
	return escaped
		.replace(
			/`([^`]+)`/g,
			'<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">$1</code>'
		)
		.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, label: string, url: string) => {
			return `<a href="${url}" class="font-medium text-primary underline underline-offset-4 hover:text-primary/80" rel="noopener noreferrer">${label}</a>`;
		});
}

export function renderMarkdownToHtml(markdown: string): string {
	if (!markdown) return '';

	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const blocks: string[] = [];
	let inList = false;
	let paragraphLines: string[] = [];

	const flushParagraph = () => {
		if (paragraphLines.length === 0) return;
		const text = formatInline(escapeHtml(paragraphLines.join(' ')));
		blocks.push(`<p class="leading-relaxed text-muted-foreground">${text}</p>`);
		paragraphLines = [];
	};

	const closeList = () => {
		if (inList) {
			blocks.push('</ul>');
			inList = false;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) {
			flushParagraph();
			closeList();
			continue;
		}

		if (line.startsWith('### ')) {
			flushParagraph();
			closeList();
			blocks.push(
				`<h3 class="mt-5 text-base font-bold text-foreground">${formatInline(escapeHtml(line.slice(4)))}</h3>`
			);
			continue;
		}

		if (line.startsWith('## ')) {
			flushParagraph();
			closeList();
			blocks.push(
				`<h2 class="mt-6 text-lg font-bold text-foreground">${formatInline(escapeHtml(line.slice(3)))}</h2>`
			);
			continue;
		}

		if (line.startsWith('# ')) {
			flushParagraph();
			closeList();
			blocks.push(
				`<h2 class="mt-6 text-xl font-bold text-foreground">${formatInline(escapeHtml(line.slice(2)))}</h2>`
			);
			continue;
		}

		if (line.startsWith('> ')) {
			flushParagraph();
			closeList();
			blocks.push(
				`<blockquote class="rounded-r-lg border-l-2 border-primary bg-muted/40 px-4 py-2 text-sm text-foreground">${formatInline(escapeHtml(line.slice(2)))}</blockquote>`
			);
			continue;
		}

		if (line.startsWith('- ') || line.startsWith('* ')) {
			flushParagraph();
			if (!inList) {
				blocks.push('<ul class="list-disc space-y-1.5 pl-5 text-muted-foreground">');
				inList = true;
			}
			blocks.push(`<li>${formatInline(escapeHtml(line.slice(2)))}</li>`);
			continue;
		}

		closeList();
		paragraphLines.push(line);
	}

	flushParagraph();
	closeList();

	return blocks.join('\n');
}

export function sanitizeRichHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
		.replace(/<(iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<(iframe|object|embed|form|input|button)[^>]*\/?>/gi, '')
		.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1=$2#$2');
}

export function renderCmsContentToHtml(content: string): string {
	if (!content) return '';
	const trimmed = content.trim();
	const looksLikeHtml = /^<(p|h[1-6]|ul|ol|blockquote|div|figure|img|br)\b/i.test(trimmed);
	if (looksLikeHtml) {
		return sanitizeRichHtml(trimmed);
	}
	return renderMarkdownToHtml(trimmed);
}
