import { useMagnifyMode } from "../contexts/MagnifyModeContext";
import "../css/MagnifyToggle.css";

interface MagnifyToggleProps {
  onClose: () => void;
}

export default function MagnifyToggle({ onClose }: MagnifyToggleProps) {
  const { useLens, setUseLens, setMagnifyMode, magnifyMode } = useMagnifyMode();

  const handleSelection = (enableLens: boolean) => {
    setUseLens(enableLens);
    setMagnifyMode(true);
    onClose();
  };

  return (
    <div className="magnify-toggle-overlay" onClick={onClose}>
      <div className="magnify-toggle-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Choose Magnification Mode</h2>
        <p>Select how you want to magnify content:</p>
        <div className="magnify-toggle-options">
          <button
            className={`magnify-option ${magnifyMode && !useLens ? 'selected' : ''}`}
            onClick={() => handleSelection(false)}
          >
            <div className="option-title">Large Text</div>
          </button>
          <button
            className={`magnify-option ${magnifyMode && useLens ? 'selected' : ''}`}
            onClick={() => handleSelection(true)}
          >
            <div className="option-title">Magnifier Lens</div>
          </button>
        </div>
        <button className="magnify-toggle-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
