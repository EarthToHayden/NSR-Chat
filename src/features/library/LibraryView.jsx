function LibraryView() {
    return (
        <section className="library-shell" aria-label="Research Library">
            <header className="library-header">
                <h2>Research Library</h2>
                <p>Search and filters are intentionally not implemented yet.</p>
            </header>

            <div className="library-toolbar">
                <input type="text" placeholder="Search (coming soon)" disabled />
                <button type="button" disabled>
                    Filters (soon)
                </button>
            </div>

            <div className="library-grid">
                <article>
                    <h3>NSR Articles</h3>
                    <p>Placeholder category for future indexed files.</p>
                </article>
                <article>
                    <h3>Event Transcripts</h3>
                    <p>Placeholder category for future searchable event content</p>
                </article>
                <article>
                    <h3>Model Outputs</h3>
                    <p>Placeholder category for future generated research artifacts.</p>
                </article>
            </div>
        </section>
    )
}

export default LibraryView