import { useState } from 'react';
//import React from 'react';

interface Props {
    onClose: () => void;
    onSubmit: (data: {
        uid: string;
        name: string;
        email: string;
        role: number;
        phone_number: string;
    }) => void;
    defaultRole: number;
}

export default function EmployeePopup({ onClose, onSubmit, defaultRole }: Props) {
    const [form, setForm] = useState({
        uid: "",
        name: "",
        email: "",
        phone_number: "",
        role: defaultRole
    });

    const [error, setError] = useState("");

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value}));
        setError("");
    }

    function handleSubmit() {
        if (!form.uid || !form.name || !form.email || !form.phone_number) {
            setError("Please fill in all fields.");
            return;
        }
        onSubmit(form);
        onClose();
    }

    const roleLabel = defaultRole === 2 ? "Manager" : "Employee";

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-96 space-y-4">
                <h2 className="text-xl font-semibold mb-2">
                    Add New {roleLabel}
                </h2>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <input
                    className="border p-2 rounded w-full"
                    placeholder="UID"
                    value={form.uid}
                    onChange={(e) => updateField("uid", e.target.value)}
                />

                <input
                className="border p-2 rounded w-full"
                placeholder="Name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                />

                <input
                className="border p-2 rounded w-full"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                />

                <input
                className="border p-2 rounded w-full"
                placeholder="Phone Number"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                />

                <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 rounded bg-gray-200 
                            transition transform duration-200 
                            hover:scale-102 hover:bg-gray-100"
                            onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="px-4 py-2 rounded text-white 
                        transition transform duration-200
                        hover:scale-102 hover:bg-white"
                    style={{ backgroundColor: "#D3191C" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E34A4D")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#D3191C")}
                    onClick={handleSubmit}
                >
                    Add {roleLabel}
                </button>
                </div>
            </div>
        </div>
    );

}