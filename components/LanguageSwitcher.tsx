'use client';

import { Language } from '@/lib/translations';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LanguageSwitcher({ language, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="language-switcher">
      <span className="lang-icon">🌐</span>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => onLanguageChange('en')}
      >
        English
      </button>
      <button
        className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
        onClick={() => onLanguageChange('zh')}
      >
        中文
      </button>
    </div>
  );
}
