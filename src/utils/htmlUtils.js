// HTML Escaping utility to prevent XSS attacks
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';

    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Alternative method using DOM API (more comprehensive)
export function escapeHtmlDom(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
