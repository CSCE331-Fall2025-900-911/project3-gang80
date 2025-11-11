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

function DrinkImage({ drink }: { drink: string }) {
  console.log("imgName passed to Popup:", drink);
  console.log("images keys:", Object.keys(images));
  console.log("resolved src:", images[drink]);
  return <img src={images[drink]} alt={drink} className="w-48 h-48"/>;
}

export default DrinkImage;