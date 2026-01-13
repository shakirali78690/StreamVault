/**
 * Subtitle Service - Wyzie Subs API Integration
 * Fetches subtitles from subs.wyzie.ru (OpenSubtitles + SubDl)
 * Free, no rate limits, no API key required
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Wyzie Subs API base URL
const WYZIE_API_URL = 'https://subs.wyzie.ru';

// Subtitle cache directory
const SUBTITLE_CACHE_DIR = path.join(process.cwd(), 'data', 'subtitles');

// Ensure cache directory exists
if (!fs.existsSync(SUBTITLE_CACHE_DIR)) {
    fs.mkdirSync(SUBTITLE_CACHE_DIR, { recursive: true });
}

export interface SubtitleResult {
    id: string;
    url: string;
    lang: string;
    language: string;
    format: string;
    hearingImpaired: boolean;
    provider: string;
}

export interface SubtitleSearchResponse {
    subtitles: SubtitleResult[];
    error?: string;
}

/**
 * Search for subtitles using IMDB ID
 * @param imdbId - IMDB ID (e.g., "tt1234567")
 * @param season - Season number (for TV shows)
 * @param episode - Episode number (for TV shows)
 * @param language - Language code (e.g., "en", "es")
 */
export async function searchSubtitles(
    imdbId: string,
    season?: number,
    episode?: number,
    language: string = 'en'
): Promise<SubtitleSearchResponse> {
    try {
        // Build API URL
        let url = `${WYZIE_API_URL}/search?id=${imdbId}&language=${language}`;

        // Add season/episode for TV shows
        if (season !== undefined && episode !== undefined) {
            url += `&season=${season}&episode=${episode}`;
        }

        console.log(`🔍 Searching subtitles: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'StreamVault/1.0',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ Subtitle search failed: ${response.status}`);
            return { subtitles: [], error: `API error: ${response.status}` };
        }

        const data = await response.json();

        // Parse response - Wyzie returns array of subtitle objects
        const subtitles: SubtitleResult[] = Array.isArray(data) ? data.map((sub: any, index: number) => ({
            id: sub.id || `sub_${index}`,
            url: sub.url || sub.SubDownloadLink || '',
            lang: sub.lang || sub.LanguageId || language,
            language: sub.language || sub.LanguageName || 'English',
            format: sub.format || 'srt',
            hearingImpaired: sub.hearingImpaired || sub.SubHearingImpaired === '1' || false,
            provider: sub.provider || 'unknown'
        })) : [];

        console.log(`✅ Found ${subtitles.length} subtitles`);
        return { subtitles };

    } catch (error: any) {
        console.error('❌ Subtitle search error:', error.message);
        return { subtitles: [], error: error.message };
    }
}

/**
 * Download and cache a subtitle file
 * @param subtitleUrl - URL to the subtitle file
 * @returns Local file path to the cached subtitle
 */
export async function downloadSubtitle(subtitleUrl: string): Promise<string | null> {
    try {
        // Generate cache filename from URL hash
        const urlHash = crypto.createHash('md5').update(subtitleUrl).digest('hex');
        const cachedPath = path.join(SUBTITLE_CACHE_DIR, `${urlHash}.vtt`);

        // Check if already cached
        if (fs.existsSync(cachedPath)) {
            console.log(`📁 Using cached subtitle: ${urlHash}`);
            return cachedPath;
        }

        console.log(`⬇️ Downloading subtitle: ${subtitleUrl}`);

        const response = await fetch(subtitleUrl, {
            headers: {
                'User-Agent': 'StreamVault/1.0'
            }
        });

        if (!response.ok) {
            console.error(`❌ Download failed: ${response.status}`);
            return null;
        }

        let content = await response.text();

        // Convert SRT to VTT if needed
        if (subtitleUrl.endsWith('.srt') || content.includes('-->') && !content.startsWith('WEBVTT')) {
            content = convertSrtToVtt(content);
        }

        // Save to cache
        fs.writeFileSync(cachedPath, content, 'utf-8');
        console.log(`💾 Cached subtitle: ${urlHash}`);

        return cachedPath;

    } catch (error: any) {
        console.error('❌ Subtitle download error:', error.message);
        return null;
    }
}

/**
 * Convert SRT format to WebVTT format
 */
function convertSrtToVtt(srt: string): string {
    // Add WEBVTT header
    let vtt = 'WEBVTT\n\n';

    // Clean up the SRT content
    const cleaned = srt
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

    // Split into subtitle blocks
    const blocks = cleaned.split(/\n\n+/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 2) continue;

        // Find the timestamp line (contains "-->")
        let timestampIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('-->')) {
                timestampIndex = i;
                break;
            }
        }

        // Convert timestamps from SRT format (00:00:00,000) to VTT format (00:00:00.000)
        const timestamp = lines[timestampIndex].replace(/,/g, '.');

        // Get the subtitle text (everything after timestamp)
        const text = lines.slice(timestampIndex + 1).join('\n');

        if (timestamp && text) {
            vtt += `${timestamp}\n${text}\n\n`;
        }
    }

    return vtt;
}

/**
 * Get cached subtitle file path by hash
 */
export function getCachedSubtitle(hash: string): string | null {
    const cachedPath = path.join(SUBTITLE_CACHE_DIR, `${hash}.vtt`);
    return fs.existsSync(cachedPath) ? cachedPath : null;
}

/**
 * Quick search and get first English subtitle
 */
export async function getFirstSubtitle(
    imdbId: string,
    season?: number,
    episode?: number
): Promise<{ url: string; language: string } | null> {
    const result = await searchSubtitles(imdbId, season, episode, 'en');

    if (result.subtitles.length === 0) {
        return null;
    }

    // Return best subtitle (first non-hearing-impaired, or first available)
    const best = result.subtitles.find(s => !s.hearingImpaired) || result.subtitles[0];

    return {
        url: best.url,
        language: best.language
    };
}
