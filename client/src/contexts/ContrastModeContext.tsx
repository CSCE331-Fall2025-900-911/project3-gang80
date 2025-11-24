import { createContext, useContext, useState } from "react";

interface ContrastContextType {
    highContrast: boolean;
    setHighContrast: React.Dispatch<React.SetStateAction<boolean>>;
    resetContrast: () => void;
}

const ContrastContext = createContext<ContrastContextType>({
    highContrast: false,
    setHighContrast: () => {},
    resetContrast: () => {},
});

export function useContrastMode() {
    return useContext(ContrastContext);
}

export function ContrastModeProvider({ children }: {children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(false);
    const resetContrast = () => setHighContrast(false);
    return (
        <ContrastContext.Provider value={{ highContrast, setHighContrast, resetContrast }}>
            <div className={highContrast ? "high-contrast" : ""}>
                {children}
            </div>
        </ContrastContext.Provider>
    );
}
