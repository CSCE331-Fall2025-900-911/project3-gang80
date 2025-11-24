import * as React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'ko', label: 'Korean' },
];

export default function LanguageSelector({ onClose }: { onClose: () => void }) {
  const { language, setLanguage } = useTranslation();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, minWidth: 300 }}>
        <h3>Select language</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {LANGUAGES.map((l) => (
            <li key={l.code} style={{ margin: '8px 0' }}>
              <button
                style={{ width: '100%', padding: '8px 10px', background: l.code === language ? '#D3191C' : '#eee', color: l.code === language ? 'white' : 'black', border: 'none', borderRadius: 4 }}
                onClick={() => { setLanguage(l.code); onClose(); }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} style={{ marginTop: 8 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
