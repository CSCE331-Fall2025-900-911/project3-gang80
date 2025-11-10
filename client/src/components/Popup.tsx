import "./popup.css";
import DrinkImage from "./DrinkImage";

interface PopupProps {
  onClose: () => void;
  title: string;
}

function Popup({ onClose, title }: PopupProps) {
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
            <h2 className="text-3xl font-medium my-20">{title}</h2>
            <div className="max-w-[200px] max-h-[200px] object-contain">
                <DrinkImage drink="tao"/>
            </div>
          </div>

          <div className="flex flex-1 bg-gray-50 rounded p-4 justify-center">
            <h2 className="text-lg font-medium">Ice Level</h2>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}

export default Popup;
