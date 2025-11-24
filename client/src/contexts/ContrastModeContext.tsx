import { createContext, useContext, useState } from "react";

interface ContrastContextType {
    highContrast: boolean;
    setHighContrast: React.Dispatch<React.SetStateAction<boolean>>;
}

const ContrastContext = createContext<ContrastContextType>({
    highContrast: false,
    setHighContrast: () => {},
});

export function useContrastMode() {
    return useContext(ContrastContext);
}

export function ContrastModeProvider({ children }: {children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(false);

    return (
        <ContrastContext.Provider value={{ highContrast, setHighContrast }}>
            <div className={highContrast ? "high-contrast" : ""}>
                {children}
            </div>
        </ContrastContext.Provider>
    );
}
