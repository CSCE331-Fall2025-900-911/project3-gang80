// TODO: Import images here
import taoImg from "../assets/engr_tao_logo.jpg";

const images : Record<string, string> = {
  tao: taoImg
};

function DrinkImage({ drink }: { drink: string }) {
  return <img src={images[drink]} alt={drink} className="w-48 h-48"/>;
}

export default DrinkImage;