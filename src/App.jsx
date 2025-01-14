import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { SECTIONS, PROMPTS } from './utils/constants';
import { useApi } from './hooks/useApi';
import { Button, MenuItem } from './components/common/CommonComponents';
import Input from './components/Input/Input';
import Analysis from './components/Analysis/Analysis';
import ActionableItems from './components/ActionableItems/ActionableItems';
import OptimizeCV from './components/OptimizeCV/OptimizeCV';
import CoverLetter from './components/CoverLetter/CoverLetter';
import { extractNameFromCV } from './utils/nameExtractor';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  DocumentDuplicateIcon, 
  EnvelopeIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const MENU_ITEMS = [
  { id: SECTIONS.INPUT, icon: DocumentTextIcon, label: 'Input' },
  { id: SECTIONS.ANALYSIS, icon: ChartBarIcon, label: 'Analysis' },
  { id: SECTIONS.ACTIONABLE, icon: ClipboardDocumentListIcon, label: 'Actions' },
  { id: SECTIONS.OPTIMIZE, icon: DocumentDuplicateIcon, label: 'Optimise CV' },
  { id: SECTIONS.COVER, icon: EnvelopeIcon, label: 'Cover Letter' }
];

function App() {
  const [state, setState] = useState({
    cvText: '',
    jobDescription: '',
    wordLimit: 200,
    activeSection: SECTIONS.INPUT,
    isDarkMode: true,
    originalFile: null
  });

  const analysisApi = useApi();
  const actionsApi = useApi();
  const coverLetterApi = useApi();
  const optimizeApi = useApi();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setState(prev => ({ ...prev, isDarkMode: savedTheme === 'dark' }));
      document.body.classList.toggle('light-mode', savedTheme === 'light');
    }
  }, []);

  const isInputEmpty = !state.cvText.trim() || !state.jobDescription.trim();

  const handleCvChange = useCallback((value, originalFile = null) => {
    setState(prev => ({
      ...prev,
      cvText: typeof value === 'string' ? value : value.target.value,
      originalFile: originalFile
    }));
  }, []);

  const handleInputChange = useCallback((field) => (e) => {
    setState(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleSectionChange = useCallback((section) => {
    setState(prev => ({ ...prev, activeSection: section }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => {
      const newIsDarkMode = !prev.isDarkMode;
      localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
      document.body.classList.toggle('light-mode', !newIsDarkMode);
      return { ...prev, isDarkMode: newIsDarkMode };
    });
  }, []);

  const handleAnalyze = async () => {
    if (isInputEmpty) return false;

    try {
      // Run all analyses in parallel
      const [analysisResult, actionsResult, optimizeResult] = await Promise.all([
        analysisApi.execute(
          PROMPTS.ANALYZE(state.cvText, state.jobDescription),
          true
        ),
        actionsApi.execute(
          PROMPTS.ACTIONS(state.cvText, state.jobDescription)
        ),
        optimizeApi.execute(
          PROMPTS.OPTIMIZE(state.cvText, state.jobDescription)
        )
      ]);

      if (analysisResult) {
        handleSectionChange(SECTIONS.ANALYSIS);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Analysis failed:', error);
      return false;
    }
  };

  const formatCoverLetter = (text) => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const userName = extractNameFromCV(state.cvText);

    return text
      .replace('[Your Name]', userName)
      .replace('[Date]', today);
  };

  const handleGenerateCoverLetter = async () => {
    if (isInputEmpty) return;
    
    const result = await coverLetterApi.execute(
      PROMPTS.COVER_LETTER(state.cvText, state.jobDescription, state.wordLimit)
    );

    if (result) {
      return formatCoverLetter(result);
    }
  };

  const renderSection = () => {
    const sections = {
      [SECTIONS.INPUT]: (
        <Input
          cvText={state.cvText}
          jobDescription={state.jobDescription}
          onCvChange={handleCvChange}
          onJobChange={handleInputChange('jobDescription')}
          onAnalyze={handleAnalyze}
          isLoading={analysisApi.loading || actionsApi.loading || optimizeApi.loading}
          error={analysisApi.error || actionsApi.error || optimizeApi.error}
        />
      ),
      [SECTIONS.ANALYSIS]: (
        <Analysis
          score={analysisApi.data?.score}
          justification={analysisApi.data?.justification}
          breakdown={analysisApi.data?.breakdown}
          cvText={state.cvText}
          jobDescription={state.jobDescription}
          error={analysisApi.error}
        />
      ),
      [SECTIONS.ACTIONABLE]: (
        <ActionableItems 
          actionableItems={actionsApi.data}
          error={actionsApi.error}
        />
      ),
      [SECTIONS.OPTIMIZE]: (
        <OptimizeCV
          optimizedCV={optimizeApi.data}
          originalCV={state.cvText}
          originalFile={state.originalFile}
          isLoading={optimizeApi.loading}
          error={optimizeApi.error}
        />
      ),
      [SECTIONS.COVER]: (
        <CoverLetter
          wordLimit={state.wordLimit}
          onWordLimitChange={handleInputChange('wordLimit')}
          onGenerate={handleGenerateCoverLetter}
          coverLetter={coverLetterApi.data}
          isLoading={coverLetterApi.loading}
          error={coverLetterApi.error}
        />
      )
    };

    return sections[state.activeSection] || null;
  };

  return (
    <div className={`app-container ${state.isDarkMode ? 'dark' : 'light'}`}>
      <nav className="side-menu">
        <div className="menu-header">
          <h1>CV Matcher</h1>
        </div>
        
        <ul>
          {MENU_ITEMS.map(({ id, icon: Icon, label }) => (
            <MenuItem
              key={id}
              isActive={state.activeSection === id}
              disabled={isInputEmpty && id !== SECTIONS.INPUT}
              onClick={() => !isInputEmpty && handleSectionChange(id)}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </MenuItem>
          ))}
        </ul>
        
        <div className="theme-toggle">
          <button 
            className="theme-toggle-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {state.isDarkMode ? (
              <>
                <SunIcon className="theme-icon" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon className="theme-icon" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </nav>
      
      <main className="content-area">
        {renderSection()}
      </main>
    </div>
  );
}

export default App;
