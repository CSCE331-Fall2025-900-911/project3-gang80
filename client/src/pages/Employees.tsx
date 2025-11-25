//import * as React from "react";
import { useEffect, useState } from "react";
import { useContrastMode } from '../contexts/ContrastModeContext';
import EmployeePopup from "../components/EmployeePopup";
import { makeApiCall } from "../globals";

interface User {
  id: number;
  name: string;
  role: number;
  email: string;
  phone_number: string;
  uid: string;
}

export default function Employees() {
  const [managers, setManagers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newUserRole, setNewUserRole] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { resetContrast } = useContrastMode();
    
  useEffect(() => {
    localStorage.removeItem("cartItems");
    resetContrast(); // ensure contrast is OFF on non-kiosk routes
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await makeApiCall("/api/db/users", "GET", null) as { users: User[]};
      const users: User[] = data?.users || [];
      setManagers(users.filter((u) => u.role === 2));
      setEmployees(users.filter((u) => u.role === 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function addUser(newUser: any) {
    const resp = await makeApiCall("/api/db/users/create", "POST", newUser);

    if (resp) {
      await loadUsers();
      setShowPopup(false);
    } else {
      console.error("failed to add user");
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const resp = await makeApiCall(`/api/db/users/${id}/delete`, "DELETE", null);

    if (resp) {
      await loadUsers();
      setDrawerOpen(false);
      setSelectedUser(null);
    } else {
      console.error("failed to delete user");
    }
  }

  const FaceCard = ({ user }: { user: User}) => (
    <button
      className="w-40 h-48 flex flex-col items-center justify-center gap-2 rounded-2xl shadow bg-white border-2 hover:bg-gray-100"
      onClick={() => {
        setSelectedUser(user);
        setDrawerOpen(true);
      }}
    >
      <div className="w-20 h-20 bg-gray-300 rounded-full" />
      <p className="text-center font-medium">{user.name}</p>
    </button>
  );

  const AddCard = ({ role }: { role: number}) => (
    <button
      className="w-40 h-48 flex flex-col items-center justify-center rounded-2xl shadow bg-white border-2 border-dashed hover:bg-gray-100 text-4xl"
      onClick={() => {
        setNewUserRole(role);
        setShowPopup(true);
      }}
    >
      +
    </button>
  );

  const Section = ({ title, data, role }: { title: string; data: User[]; role: number }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {data.map((u) => (
          <FaceCard key={u.id} user={u} />
        ))}
      <AddCard role={role}/>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Employees Page</h1>
      <Section title="Managers" data={managers} role={2} />
      <Section title="Employees" data={employees} role={1} />

      {showPopup && (
        <EmployeePopup
          onClose={() => setShowPopup(false)}
          onSubmit={addUser}
          defaultRole={newUserRole}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 p-6 transform transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedUser && (
          <>
            {drawerOpen && (
              <button
                className="absolute left-0 top-1/2 -translate-x-full bg-white shadow-lg rounded-l-full px-3 py-2 text-xl font-bold"
                onClick={() => setDrawerOpen(false)}
              >
                &gt;
              </button>
            )}

            <h2 className="text-2xl font-semibold mb-4">User Details</h2>

            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Phone:</strong> {selectedUser.phone_number}</p>
            <p><strong>Role:</strong> {selectedUser.role === 2 ? "Manager" : "Employee"}</p>
            <p><strong>UID:</strong> {selectedUser.uid}</p>

            <button
              className="mt-6 w-full py-2 text-white rounded transition duration-200 hover:scale-105"
              style={{ backgroundColor: "#D3191C" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#E34A4D")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#D3191C")}
              onClick={() => handleDeleteUser(selectedUser.id)}
            >
              Delete User
            </button>
          </>
        )}
      </div>


    </div>
  );

}

