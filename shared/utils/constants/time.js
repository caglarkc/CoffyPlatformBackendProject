// Türkiye saati için UTC+3 ayarı
const utcNow = () => {
    const now = new Date();
    return now;
};

// Türkiye saati (UTC+3)
const now = () => {
    const utc = utcNow();
    // UTC saatine 3 saat ekleyerek Türkiye saatini elde ediyoruz
    return new Date(utc.getTime() + (3 * 60 * 60 * 1000));
};

const hourAgo = (time) => new Date(time - 60 * 60 * 1000);
const dayAgo = (time) => new Date(time - 24 * 60 * 60 * 1000);
const weekAgo = (time) => new Date(time - 7 * 24 * 60 * 60 * 1000);

// Timestamp'i ISO formatına dönüştürür
const formatExpiresAt = (timestamp) => {
    if (typeof timestamp === 'number') {
        return new Date(timestamp).toISOString();
    } else if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    return null;
};

module.exports = {
    NOW: now,
    UTC_NOW: utcNow,
    HOUR_AGO: hourAgo,
    DAY_AGO: dayAgo,
    WEEK_AGO: weekAgo,
    FORMAT_EXPIRES_AT: formatExpiresAt
}; 