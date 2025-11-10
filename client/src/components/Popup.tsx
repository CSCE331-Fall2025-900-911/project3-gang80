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
            <h2>{title}</h2>
            <div className="max-w-[200px] max-h-[200px] object-contain">
                <DrinkImage drink="tao"/>
            </div>
          </div>

          <div className="flex flex-1 bg-blue-500 rounded p-4">
            <p className="text-red-50">Right section content here</p>
          </div>
        </div>
        
        
      </div>
    </div>
  );
}

export default Popup;
