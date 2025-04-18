function formatErrorMessage(message, replacements) {
    if (!message || !replacements) return message;
    return message.replace(/\{(\w+)\}/g, (match, key) => replacements[key] || match);
}

module.exports = {
    formatErrorMessage
}; 