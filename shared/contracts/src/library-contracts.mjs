export const LibrarySearchQuerySchema = Object.freeze({
    q: 'string (optional)',
    kind: 'string (optional)',
    tags: 'string[] (optional)',
})

export const LibrarySearchResultSchema = Object.freeze({
    id: 'string',
    title: 'string',
    kind: 'string',
    sourceUrl: 'string',
    snippet: 'string (optional)',
})

export const LibrarySearchResponseSchema = Object.freeze({
    items: 'LibrarySearchResult[]',
    total: 'number',
    query: 'LibrarySearchQuery',
})