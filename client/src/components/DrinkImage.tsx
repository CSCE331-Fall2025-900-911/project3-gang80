// TODO: Import images here
import classicMilkTeaImg from "../assets/classicmilktea.png";
import honeyMilkTeaImg from "../assets/honeymilktea.png";
import coffeeCreamaImg from "../assets/coffeecrema.png";
import thaiMilkTeaImg from "../assets/thaimilktea.png";
import mangoGreenMilkTeaImg from "../assets/mangomilktea.png";
import taroMilkTeaImg from "../assets/taromilktea.png";
import hokkaidoMilkTeaImg from "../assets/hokkaidomilktea.png";
import coconutMilkTeaImg from "../assets/coconutmilktea.png";
import mangoGreenTeaImg from "../assets/mangomilktea.png";
import berryLycheeBurstImg from "../assets/berrylychee.png";
import honeyLemonadeImg from "../assets/honeylemonade.png";
import wintermelonLemonadeImg from "../assets/wintermelonlemonade.png";
import haloHaloImg from "../assets/halohalo.png";
import matchaPearlImg from "../assets/matchamilktea.png";
import strawberryMatchaImg from "../assets/strawberrymatcha.png";
import mangoMatchaImg from "../assets/mangomatcha.png";
import oreoPearlImg from "../assets/oreopearl.png";
import taroPuddingImg from "../assets/taropudding.png";
import lavaFlowImg from "../assets/lavaflow.png";
import peachTeaImg from "../assets/peachtea.png";

const images : Record<string, string> = {
  classicPearl: classicMilkTeaImg,
  honeyPearl: honeyMilkTeaImg,
  coffeeCreama: coffeeCreamaImg,
  thaiPearl: thaiMilkTeaImg,
  mangoGreenMilkTea: mangoGreenMilkTeaImg,
  taroPearl: taroMilkTeaImg,
  hokkaidoPearl: hokkaidoMilkTeaImg,
  coconutPearl: coconutMilkTeaImg,
  mangoGreenTea: mangoGreenTeaImg,
  berryLycheeBurst: berryLycheeBurstImg,
  honeyLemonade: honeyLemonadeImg,
  wintermelonLemonade: wintermelonLemonadeImg,
  haloHalo: haloHaloImg,
  matchaPearl: matchaPearlImg,
  strawberryMatchaFreshMilk: strawberryMatchaImg,
  mangoMatchaFreshMilk: mangoMatchaImg,
  oreoPearl: oreoPearlImg,
  taroPudding: taroPuddingImg,
  lavaFlow: lavaFlowImg,
  peachTeaLycheeJelly: peachTeaImg,
};

interface DrinkImageProps {
  drink: string;
  size?: number; 
  variant?: 'popup' | 'cashier';
  fill?: boolean; 
  className?: string;
}

function DrinkImage({ drink, size, variant = 'popup', fill = false, className = "" }: DrinkImageProps) {
  const defaultSize = variant === 'cashier' ? 64 : 48;
  const resolvedSize = size ?? defaultSize;
  const src = images[drink];
  if (!src) {
    const placeholderStyle = fill
      ? { maxWidth: resolvedSize, maxHeight: '100%', width: 'auto' as const, height: '100%' as const }
      : { width: resolvedSize, height: resolvedSize };
    return (
      <div
        style={placeholderStyle}
        className={`bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-600 ${className}`}
      >
        N/A
      </div>
    );
  }

  const imgStyle = fill
    ? { maxWidth: resolvedSize, maxHeight: '100%', width: 'auto' as const, height: '100%' as const }
    : { width: resolvedSize, height: resolvedSize };

  return <img src={src} alt={drink} style={imgStyle} className={`object-contain ${className}`} />;
}

export default DrinkImage;