import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageHomeSlider = () => {
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    buttonText: "",
    img1: null as File | null,
    img2: null as File | null,
    img3: null as File | null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSliderId, setDeleteSliderId] = useState<number | null>(null);
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchSliders();
    // eslint-disable-next-line
  }, [token]);

  const fetchSliders = async () => {
    setLoading(true);
    const res = await fetch("/api/HomeSlider/GetAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSliders(await res.json());
    setLoading(false);
  };

  // Edit modal aç
  const startEdit = (slider: any) => {
    setEditId(slider.id);
    setEditForm({
      title: slider.title || "",
      description: slider.description || "",
      buttonText: slider.buttonText || "",
      img1: null,
      img2: null,
      img3: null,
    });
    setShowEditModal(true);
  };

  // Editi göndər
  const handleEditSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData();
    formData.append("Id", editId.toString());
    formData.append("Title", editForm.title);
    formData.append("Description", editForm.description);
    formData.append("ButtonText", editForm.buttonText);
    if (editForm.img1) formData.append("Img1", editForm.img1);
    if (editForm.img2) formData.append("Img2", editForm.img2);
    if (editForm.img3) formData.append("Img3", editForm.img3);

    const res = await fetch(`/api/HomeSlider/admin/Edit`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      fetchSliders();
    }
  };

  // Delete modal aç
  const handleDeleteSlider = (id: number) => {
    setDeleteSliderId(id);
    setDeleteDialogOpen(true);
  };

  // Delete göndər
  const confirmDeleteSlider = async () => {
    if (!deleteSliderId) return;
    const res = await fetch(`/api/HomeSlider/admin/Delete/${deleteSliderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSliders(sliders => sliders.filter(s => s.id !== deleteSliderId));
    setDeleteDialogOpen(false);
    setDeleteSliderId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage HomeSlider</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {sliders.map(slider => (
            <div key={slider.id} className="flex items-center justify-between p-4 border rounded bg-white shadow">
              <div>
                <div className="font-bold text-[#fbbf24]">{slider.title}</div>
                <div className="text-xs text-gray-400">Description: {slider.description}</div>
                <div className="text-xs text-gray-400">Button: {slider.buttonText}</div>
                <div className="flex gap-2 mt-2">
                  {slider.img1Url && <img src={slider.img1Url} alt="img1" className="w-16 h-16 object-cover rounded" />}
                  {slider.img2Url && <img src={slider.img2Url} alt="img2" className="w-16 h-16 object-cover rounded" />}
                  {slider.img3Url && <img src={slider.img3Url} alt="img3" className="w-16 h-16 object-cover rounded" />}
                </div>
              </div>
              <div>
                <Button variant="default" className="mr-2" onClick={() => startEdit(slider)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteSlider(slider.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit HomeSlider</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditSlider}>
            <Input
              placeholder="Title"
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            <Input
              placeholder="Description"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            />
            <Input
              placeholder="Button Text"
              value={editForm.buttonText}
              onChange={e => setEditForm(f => ({ ...f, buttonText: e.target.value }))}
            />
            <label className="block text-sm font-medium text-gray-700">Image 1</label>
            <Input
              type="file"
              accept="image/*"
              onChange={e =>
                setEditForm(f => ({
                  ...f,
                  img1: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                }))
              }
            />
            <label className="block text-sm font-medium text-gray-700">Image 2</label>
            <Input
              type="file"
              accept="image/*"
              onChange={e =>
                setEditForm(f => ({
                  ...f,
                  img2: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                }))
              }
            />
            <label className="block text-sm font-medium text-gray-700">Image 3</label>
            <Input
              type="file"
              accept="image/*"
              onChange={e =>
                setEditForm(f => ({
                  ...f,
                  img3: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                }))
              }
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Delete HomeSlider</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu slideri silmək istədiyinizə əminsiniz?<br />
            Silinən slider geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteSlider}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageHomeSlider;