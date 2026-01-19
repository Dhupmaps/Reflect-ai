import { RotateCcw, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ResultCard = ({ title, content, content2, icon: Icon = Sparkles, color, isRefinement = false, onRegenerate }) => {
    // If we have content2, it implies dual options mode (Refinement)
    const [activeOption, setActiveOption] = useState(1);

    // If no primary content, return null
    if (!content) return null;

    // Determine variant class
    let variantClass = 'card-slate';
    if (color === '#ef4444') variantClass = 'card-red';
    if (color === '#10b981') variantClass = 'card-emerald';

    const isCritique = title.includes("Critique");
    const showDualOptions = isRefinement && content2;

    const displayContent = showDualOptions && activeOption === 2 ? content2 : content;

    return (
        <div className={`result-card ${variantClass}`}>
            <div className="result-card-header">
                <Icon size={20} style={{ marginRight: '8px' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
            </div>

            {showDualOptions && (
                <div className="refinement-controls">
                    <button
                        className={`refinement-btn ${activeOption === 1 ? 'active' : ''}`}
                        onClick={() => setActiveOption(1)}
                    >
                        Option 1 (Formal)
                    </button>
                    <button
                        className={`refinement-btn ${activeOption === 2 ? 'active' : ''}`}
                        onClick={() => setActiveOption(2)}
                    >
                        Option 2 (Engaging)
                    </button>
                </div>
            )}

            <div className="result-card-content">
                <ReactMarkdown
                    components={{
                        strong: ({ node, ...props }) => (
                            <strong style={{
                                color: isCritique ? 'var(--accent-color)' : 'inherit',
                                fontWeight: '700'
                            }} {...props} />
                        )
                    }}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>

            {isRefinement && onRegenerate && (
                <button className="regenerate-btn" onClick={onRegenerate}>
                    <RotateCcw size={16} />
                    Regenerate Answer
                </button>
            )}
        </div>
    );
};

export default ResultCard;