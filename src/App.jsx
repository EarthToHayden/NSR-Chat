import { useState } from 'react'
import './App.css'

function App() {
  const [activeDesign, setActiveDesign] = useState('design-a')
  const isMinimalDesign = activeDesign === 'design-b'
  const isDesignC = activeDesign === 'design-c'

  return (
    <div className={`app-shell ${isDesignC ? 'design-c' : ''}`}>
      <header className="topbar">
        <div className="brand">NEW STREET RESEARCH</div>
        <div className="topbar-controls">
          <div className="badge">AI CHAT MOCKUP</div>
          <div className="design-tabs" role="tablist" aria-label="Design variations">
            <button
              type="button"
              role="tab"
              aria-selected={activeDesign === 'design-a'}
              className={activeDesign === 'design-a' ? 'active' : ''}
              onClick={() => setActiveDesign('design-a')}
            >
              Design A
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDesign === 'design-b'}
              className={activeDesign === 'design-b' ? 'active' : ''}
              onClick={() => setActiveDesign('design-b')}
            >
              Design B - Minimal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDesign === 'design-c'}
              className={activeDesign === 'design-c' ? 'active' : ''}
              onClick={() => setActiveDesign('design-c')}
            >
              Design C - Docked Sidebar
            </button>
          </div>
        </div>
      </header>

      <main className="page-content">
        <p className="eyebrow">NEW STREET RESEARCH AI ASSISTANT</p>
        <h1>Research Intelligence Workspace</h1>
        {isMinimalDesign ? (
          <p className="intro intro-minimal">Ask. Answer. Act.</p>
        ) : (
          <p className="intro">
            Ask questions across New Street Research coverage and get concise answers,
            supporting context, and fast access to relevant research themes.
          </p>
        )}

        <section
          className={`preview-grid ${isMinimalDesign ? 'preview-grid-minimal' : ''}`}
          aria-label="Mock sections"
        >
          <article>
            <h2>Research</h2>
            {!isMinimalDesign && (
              <p>Quick summary blocks, analyst notes, and latest coverage highlights.</p>
            )}
          </article>
          <article>
            <h2>Events</h2>
            {!isMinimalDesign && (
              <p>Upcoming calls, roadshows, and searchable session recaps.</p>
            )}
          </article>
          <article>
            <h2>Data</h2>
            {!isMinimalDesign && (
              <p>Signals, charts, and trend snapshots surfaced directly in chat workflows.</p>
            )}
          </article>
        </section>

        <section className="chat-workspace" aria-label="AI chat workspace">
          <aside className="chat-sidebar" aria-label="Previous conversations">
            <h2>Conversations</h2>
            <ul>
              <li className="active">US Telecom Outlook Q3</li>
              <li>European Fiber Build Trends</li>
              <li>AI Infrastructure Winners</li>
              <li>Policy and Spectrum Update</li>
            </ul>
          </aside>

          <div className="chat-panel">
            <div className="chat-messages">
              <div className="msg msg-user">Summarize key risks for U.S. cable in 2026.</div>
              <div className="msg msg-ai">
                Key risks include broadband share pressure, rising content costs, and
                execution variability on fixed wireless responses.
              </div>
            </div>

            <div className="chat-box" role="region" aria-label="AI chat input">
              <textarea
                placeholder="Ask NSR AI about coverage, themes, or market questions..."
                rows="1"
              />
              <button type="button">Send</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
