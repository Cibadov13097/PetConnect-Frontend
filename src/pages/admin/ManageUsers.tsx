import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    userName: "",
    fullname: "",
    email: "",
    userType: "",
    telephoneNumber: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/User/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      fetchUsers();
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/User/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(await res.json());
    } else {
      setUsers([]);
    }
    setLoading(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body = {
      UserName: editForm.userName,
      Fullname: editForm.fullname,
      Email: editForm.email,
      UserType: editForm.userType,
      TelephoneNumber: editForm.telephoneNumber,
    };
    const res = await fetch(`/api/admin/User/edit/${editId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      fetchUsers();
    }
  };

  const startEdit = (user: any) => {
    setEditId(user.id);
    setEditForm({
      userName: user.userName || "",
      fullname: user.fullname || "",
      email: user.email || "",
      userType: user.userType || "",
      telephoneNumber: user.telephoneNumber || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (id: string) => {
    setDeleteUserId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    const res = await fetch(`/api/admin/User/delete/${deleteUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers(users => users.filter(u => u.id !== deleteUserId));
    setDeleteDialogOpen(false);
    setDeleteUserId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Users</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by fullname or username..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={() => { setSearchText(""); fetchUsers(); }}>
          Clear
        </Button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded bg-white shadow">
              <div>
                <div className="font-bold text-[#fbbf24]">{user.userName}</div>
                <div className="text-xs text-gray-400">Full Name: {user.fullname}</div>
                <div className="text-xs text-gray-400">Email: {user.email}</div>
                <div className="text-xs text-gray-400">Tel: {user.telephoneNumber}</div>
                <div className="text-xs text-gray-400">User Type: {user.userType}</div>
                <div className="text-xs text-gray-400">Budget: {user.budget} ₼</div>
                <div className="text-xs text-gray-400">Created: {user.createdDate?.slice(0, 10)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(user)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit User</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditUser}>
            <Input
              placeholder="Username"
              value={editForm.userName}
              onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))}
              required
            />
            <Input
              placeholder="Full Name"
              value={editForm.fullname}
              onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <select
              className="w-full border rounded px-3 py-2"
              value={editForm.userType}
              onChange={e => setEditForm(f => ({ ...f, userType: e.target.value }))}
            >
              <option value="">Select User Type</option>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="ShopOwner">ShopOwner</option>
              <option value="ShelterOwner">ShelterOwner</option>
            </select>
            <Input
              placeholder="Telephone Number"
              value={editForm.telephoneNumber}
              onChange={e => setEditForm(f => ({ ...f, telephoneNumber: e.target.value }))}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Delete User</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu istifadəçini silmək istədiyinizə əminsiniz?<br />
            Silinən istifadəçi geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteUser}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;