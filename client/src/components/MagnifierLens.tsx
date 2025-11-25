interface MagnifierLensProps {
  lensPos: {x: number; y: number};
  lensText: string;
  lensImageSrc: string | null;
  lensImageAlt: string;
  magnifyMode: boolean;
  useLens: boolean;
}

export function MagnifierLens({ lensPos, lensText, lensImageSrc, lensImageAlt, magnifyMode, useLens }: MagnifierLensProps) {
  if (!magnifyMode || !useLens || (!lensImageSrc && !lensText)) return null;

  return (
    <div
      className="magnifier-lens"
      style={{ left: lensPos.x - 100, top: lensPos.y - 100 }}
    >
      {lensImageSrc ? (
        <img src={lensImageSrc} alt={lensImageAlt} className="magnifier-image" />
      ) : (
        <div className="magnifier-content">{lensText}</div>
      )}
    </div>
  );
}
