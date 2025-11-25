import { createContext, useContext, useState } from "react";

interface MagnifyContextType {
    magnifyMode: boolean;
    setMagnifyMode: React.Dispatch<React.SetStateAction<boolean>>;
    useLens: boolean;
    setUseLens: React.Dispatch<React.SetStateAction<boolean>>;
    resetMagnify: () => void;
}

const MagnifyContext = createContext<MagnifyContextType>({
    magnifyMode: false,
    setMagnifyMode: () => {},
    useLens: true,
    setUseLens: () => {},
    resetMagnify: () => {},
});

export function useMagnifyMode() {
    return useContext(MagnifyContext);
}

export function MagnifyModeProvider({ children }: {children: React.ReactNode }) {
    const [magnifyMode, setMagnifyMode] = useState(false);
    const [useLens, setUseLens] = useState(true);
    const resetMagnify = () => {
        setMagnifyMode(false);
        setUseLens(true);
    };
    return (
        <MagnifyContext.Provider value={{ magnifyMode, setMagnifyMode, useLens, setUseLens, resetMagnify }}>
            {children}
        </MagnifyContext.Provider>
    );
}
