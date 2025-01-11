import React, { useState } from 'react';
import './App.css';
import { saveAsPDF, saveAsDOC } from './utils/fileSaver';

function App() {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [score, setScore] = useState(null);
  const [justification, setJustification] = useState('');
  const [actionableItems, setActionableItems] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [optimizedCV, setOptimizedCV] = useState('');
  const [wordLimit, setWordLimit] = useState(200);
  const [loadingState, setLoadingState] = useState({ 
    analyzing: false, 
    generating: false, 
    optimizing: false 
  });
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('input');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-mode');
  };

  const handleApiCall = async (prompt, stateKey, successHandler) => {
    if (!cvText.trim() || !jobDescription.trim()) {
      setError('Please provide both CV and Job Description');
      return;
    }

    setLoadingState(prev => ({ ...prev, [stateKey]: true }));
    setError('');

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: stateKey === 'optimizing' ? 2000 : 1000
        })
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      if (!responseData.choices?.[0]?.message?.content) throw new Error('Invalid API response format');

      successHandler(responseData.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
      setError(`${stateKey === 'analyzing' ? 'Analysis' : 
                stateKey === 'generating' ? 'Cover letter generation' : 
                'CV optimization'} failed: ${error.message}`);
    } finally {
      setLoadingState(prev => ({ ...prev, [stateKey]: false }));
    }
  };

  const handleAnalyze = async () => {
    const prompt = `Analyze this CV and Job Description:
      CV: ${cvText}
      Job Description: ${jobDescription}
      Provide: 1. A suitability score (0-100) 2. A concise analysis (max 150 words, second person)
      Format response as JSON: { "score": number, "justification": string }`;

    await handleApiCall(prompt, 'analyzing', (content) => {
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedContent);
      setScore(result.score);
      setJustification(result.justification);
      
      const actionPrompt = `Based on this CV and Job Description:
        CV: ${cvText}
        Job Description: ${jobDescription}
        Provide: 1. Specific areas to improve 2. Actionable steps (max 150 words)
        Format as a list without bullet points`;
      
      handleApiCall(actionPrompt, 'analyzing', (actionContent) => {
        setActionableItems(actionContent);
      });
      
      setActiveSection('analysis');
    });
  };

  const handleGenerateCoverLetter = async () => {
    const prompt = `Write a professional cover letter based on:
      CV: ${cvText}
      Job Description: ${jobDescription}
      Requirements: 1. Professional tone 2. Highlight relevant skills
      3. Under ${wordLimit} words 4. Address hiring manager
      5. Strong opening/closing`;

    await handleApiCall(prompt, 'generating', (content) => {
      setCoverLetter(content);
      setActiveSection('coverLetter');
    });
  };

  const handleOptimizeCV = async () => {
    const prompt = `Optimize this CV for the job description:
      Original CV: ${cvText}
      Job Description: ${jobDescription}
      Requirements: 1. Keep factual info 2. No new info
      3. Maintain format 4. Reorganize for job requirements
      5. Highlight relevant skills 6. Keep original length`;

    await handleApiCall(prompt, 'optimizing', (content) => {
      setOptimizedCV(content);
      setActiveSection('optimizeCV');
    });
  };

  const handleSavePDF = () => {
    if (!optimizedCV) {
      setError('No optimized CV to save');
      return;
    }
    saveAsPDF(optimizedCV);
  };

  const handleSaveDOC = () => {
    if (!optimizedCV) {
      setError('No optimized CV to save');
      return;
    }
    saveAsDOC(optimizedCV);
  };

  const getScoreColor = (score) => {
    if (score === null) return '#666';
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#FFC107';
    return '#F44336';
  };

  const isInputEmpty = !cvText.trim() || !jobDescription.trim();

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      <nav className="side-menu">
        <div className="menu-header">
          <h1>CV Matcher</h1>
        </div>
        <ul>
          <li 
            className={activeSection === 'input' ? 'active' : ''}
            onClick={() => setActiveSection('input')}
          >
            Input
          </li>
          <li 
            className={activeSection === 'analysis' ? 'active' : ''}
            onClick={() => !isInputEmpty && setActiveSection('analysis')}
            style={{ opacity: isInputEmpty ? 0.5 : 1, pointerEvents: isInputEmpty ? 'none' : 'auto' }}
          >
            Analysis
          </li>
          <li 
            className={activeSection === 'actionableItems' ? 'active' : ''}
            onClick={() => !isInputEmpty && setActiveSection('actionableItems')}
            style={{ opacity: isInputEmpty ? 0.5 : 1, pointerEvents: isInputEmpty ? 'none' : 'auto' }}
          >
            Actionable Items
          </li>
          <li 
            className={activeSection === 'optimizeCV' ? 'active' : ''}
            onClick={() => !isInputEmpty && setActiveSection('optimizeCV')}
            style={{ opacity: isInputEmpty ? 0.5 : 1, pointerEvents: isInputEmpty ? 'none' : 'auto' }}
          >
            Optimize CV
          </li>
          <li 
            className={activeSection === 'coverLetter' ? 'active' : ''}
            onClick={() => !isInputEmpty && setActiveSection('coverLetter')}
            style={{ opacity: isInputEmpty ? 0.5 : 1, pointerEvents: isInputEmpty ? 'none' : 'auto' }}
          >
            Cover Letter
          </li>
        </ul>
        <div className="theme-toggle">
          <button onClick={toggleTheme}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </nav>

      <main className="content-area">
        {activeSection === 'input' && (
          <div className="input-section">
            <div className="input-group">
              <h2>Your CV</h2>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV here..."
                rows={8}
              />
            </div>
            
            <div className="input-group">
              <h2>Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
              />
            </div>

            <button 
              className="primary"
              onClick={handleAnalyze} 
              disabled={loadingState.analyzing || isInputEmpty}
            >
              {loadingState.analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        )}

        {activeSection === 'analysis' && (
          <div className="analysis-section">
            <div className="score-container">
              <div className="score" style={{ backgroundColor: getScoreColor(score) }}>
                Match Score: {score}
              </div>
              <div className="analysis-content">
                <h2>Analysis</h2>
                <p>{justification}</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'actionableItems' && (
          <div className="actionable-items-section">
            <h2>Actionable Items</h2>
            <div className="actionable-content">
              {actionableItems}
            </div>
          </div>
        )}

        {activeSection === 'optimizeCV' && (
          <div className="optimize-section">
            <button 
              className="primary"
              onClick={handleOptimizeCV} 
              disabled={loadingState.optimizing}
            >
              {loadingState.optimizing ? 'Optimizing...' : 'Optimize CV'}
            </button>
            {optimizedCV && (
              <>
                <textarea 
                  value={optimizedCV} 
                  readOnly 
                  rows={12} 
                />
                <div className="save-buttons">
                  <button onClick={handleSavePDF}>Save as PDF</button>
                  <button onClick={handleSaveDOC}>Save as DOC</button>
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === 'coverLetter' && (
          <div className="cover-letter-section">
            <div className="controls">
              <label>
                <span>Word Limit:</span>
                <input
                  type="number"
                  value={wordLimit}
                  onChange={(e) => setWordLimit(e.target.value)}
                  min="100"
                  max="1000"
                />
              </label>
              <button 
                className="primary"
                onClick={handleGenerateCoverLetter} 
                disabled={loadingState.generating}
              >
                {loadingState.generating ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
            {coverLetter && (
              <textarea 
                value={coverLetter} 
                readOnly 
                rows={12} 
              />
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </main>
    </div>
  );
}

export default App;
