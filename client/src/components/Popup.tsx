import "./popup.css";
import DrinkImage from "./DrinkImage";

interface PopupProps {
  onClose: () => void;
  onAdd: () => void;     
  title: string;
  imgName: string;
}

function Popup({ onClose, title, imgName }: PopupProps) {

  return (
    <div className="popup">
      <div className="background">

        <div className="popup-bar">
            <button onClick={onClose} className="popup-button">Close</button>
            <h2 className="text-xl font-semibold">Customization</h2>
            <button onClick={onClose}>Add</button> 
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col bg-gray-50 rounded p-4 justify-center items-center">
            <h2 className="text-3xl font-bold my-10">{title}</h2>
            <div className="max-w-[200px] object-contain">
                <DrinkImage drink={imgName}/>
            </div>
          </div>

          <div className="flex flex-1 bg-gray-50 rounded p-4 justify-center">
            <div>
              <h2 className="text-lg font-medium">Ice Level</h2>
              <div className="flex gap-3 justify-center mb-4">
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Extra
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Regular
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Light
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  None
                </button>
                
              </div>
              <h2 className="text-lg font-medium justify-center">Sweetness Level</h2>
              <div className="flex gap-3 mb-4">
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  120%
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  100%
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  80%
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  50%
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  30%
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  0%
                </button>
                
              </div>
              <h2 className="text-lg font-medium justify-center">Toppings</h2>
              <div className="flex gap-3 mb-4">
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Boba
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Coffee Jelly
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Pudding
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Lychee Jelly
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Honey Jelly
                </button>
              </div>
              <div className="flex gap-3 mb-4">
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Crystal Boba
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Mango Popping Boba
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Strawberry Popping Boba
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Ice Cream
                </button>
                <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition">
                  Crema
                </button>
              </div>
            </div>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}

export default Popup;
