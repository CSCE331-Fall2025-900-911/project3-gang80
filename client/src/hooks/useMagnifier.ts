import { useState } from "react";

export function useMagnifier() {
  const [lensPos, setLensPos] = useState<{x:number;y:number}>({x:0,y:0});
  const [lensText, setLensText] = useState<string>("");
  const [lensImageSrc, setLensImageSrc] = useState<string | null>(null);
  const [lensImageAlt, setLensImageAlt] = useState<string>("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, magnifyMode: boolean) => {
    if (!magnifyMode) return;
    const { clientX, clientY } = e;
    setLensPos({ x: clientX, y: clientY });
    const el = document.elementFromPoint(clientX, clientY);
    if (el) {
      let img: HTMLImageElement | null = null;
      if ((el as HTMLElement).tagName === 'IMG') {
        img = el as HTMLImageElement;
      } else {
        const parentImg = (el as HTMLElement).closest('.drink-tile-img, .magnifiable')?.querySelector('img');
        if (parentImg && parentImg instanceof HTMLImageElement) img = parentImg;
      }
      if (img && img.src) {
        setLensImageSrc(img.src);
        setLensImageAlt(img.alt || 'Magnified image');
        setLensText("");
      } else {
        setLensImageSrc(null);
        setLensImageAlt("");
        const htmlEl = el as HTMLElement;
        
        // First check if the element itself has no children (leaf node) or only text nodes
        const hasElementChildren = Array.from(htmlEl.children).some(child => child.nodeType === 1);
        const text = htmlEl.innerText?.trim();
        
        if (text && text.length > 0 && !hasElementChildren) {
          // If text is long, extract a portion based on cursor position
          if (text.length > 30) {
            const words = text.split(/\s+/);
            const rect = htmlEl.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            
            // Find which words are near the cursor
            // Create a temporary span to measure text positions
            const range = document.createRange();
            const textNode = Array.from(htmlEl.childNodes).find(node => node.nodeType === 3) as Text;
            
            if (textNode) {
              let bestMatch = text;
              let minDistance = Infinity;
              let currentPos = 0;
              
              // Check each word to find the closest one to the cursor
              for (let i = 0; i < words.length; i++) {
                const wordStart = text.indexOf(words[i], currentPos);
                if (wordStart === -1) continue;
                
                try {
                  range.setStart(textNode, wordStart);
                  range.setEnd(textNode, wordStart + words[i].length);
                  const wordRect = range.getBoundingClientRect();
                  const wordCenterX = wordRect.left - rect.left + wordRect.width / 2;
                  const distance = Math.abs(wordCenterX - relativeX);
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    // Show the current word plus a few surrounding words
                    const startIdx = Math.max(0, i - 2);
                    const endIdx = Math.min(words.length, i + 3);
                    bestMatch = words.slice(startIdx, endIdx).join(' ');
                  }
                } catch (e) {
                  // If range fails, fall back to simple method
                }
                
                currentPos = wordStart + words[i].length;
              }
              
              setLensText(bestMatch);
            } else {
              // Fallback: use horizontal position only
              const wordCount = Math.min(5, words.length);
              const charPosition = Math.floor((relativeX / rect.width) * text.length);
              const avgCharsPerWord = text.length / words.length;
              const wordIndex = Math.floor(charPosition / avgCharsPerWord);
              const startIndex = Math.max(0, wordIndex - 2);
              const endIndex = Math.min(words.length, startIndex + wordCount);
              setLensText(words.slice(startIndex, endIndex).join(' '));
            }
          } else {
            setLensText(text);
          }
        } else {
          setLensText("");
        }
      }
    } else {
      setLensImageSrc(null);
      setLensImageAlt("");
      setLensText("");
    }
  };

  return {
    lensPos,
    lensText,
    lensImageSrc,
    lensImageAlt,
    handleMouseMove
  };
}
