import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", image: null as File | null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [token]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    const res = await fetch(`/api/admin/product/getAll?pageNumber=${page}&pageSize=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.Items || []);
      setTotalPages(data.TotalPages || 1);
      setPageNumber(data.PageNumber || 1);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      fetchProducts(1);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/product/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProducts(await res.json());
      setTotalPages(1); // No pagination for search
      setPageNumber(1);
    } else {
      setProducts([]);
      setTotalPages(1);
      setPageNumber(1);
    }
    setLoading(false);
  };

  const startEdit = (product: any) => {
    setEditId(product.id);
    setEditForm({
      name: product.name || "",
      price: product.price || "",
      image: null,
    });
    setShowEditModal(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData();
    formData.append("Name", editForm.name);
    formData.append("Price", editForm.price);
    if (editForm.image) formData.append("file", editForm.image);

    const res = await fetch(`/api/admin/product/edit/${editId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      fetchProducts();
    }
  };

  const handleDeleteProduct = (id: number) => {
    setDeleteProductId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    const res = await fetch(`/api/admin/product/delete/${deleteProductId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setProducts(products => products.filter(p => p.id !== deleteProductId));
    setDeleteDialogOpen(false);
    setDeleteProductId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Products</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by product name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchText("");
            fetchProducts();
          }}
        >
          Clear
        </Button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div className="grid gap-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 border rounded bg-white shadow">
              <div>
                <div className="font-bold text-[#fbbf24]">{product.name}</div>
                <div className="text-xs text-gray-400">ID: {product.id}</div>
                <div className="text-xs text-gray-400">Price: {product.price}</div>
                <div className="text-xs text-gray-400">Category: {product.categoryName}</div>
                <div className="text-xs text-gray-400">Shop: {product.shopName}</div>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt="product" className="w-16 h-16 object-cover rounded mt-2" />
                )}
              </div>
              <div>
                <Button variant="default" className="mr-2" onClick={() => startEdit(product)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
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
            <DialogTitle className="text-[#fbbf24]">Edit Product</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditProduct}>
            <Input
              placeholder="Name"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Price"
              type="number"
              value={editForm.price}
              onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
              required
            />
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={e =>
                setEditForm(f => ({
                  ...f,
                  image: e.target.files && e.target.files[0] ? e.target.files[0] : null,
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
            <DialogTitle className="text-[#fbbf24]">Delete Product</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu məhsulu silmək istədiyinizə əminsiniz?<br />
            Silinən məhsul geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteProduct}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            disabled={pageNumber === 1}
            onClick={() => fetchProducts(pageNumber - 1)}
          >
            Previous
          </Button>
          <span className="px-2 py-1 text-sm">
            Page {pageNumber} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pageNumber === totalPages}
            onClick={() => fetchProducts(pageNumber + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;