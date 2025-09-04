import { Route } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminPanel from "../pages/admin/AdminPanel";
import ManagePets from "../pages/admin/ManagePets";
import AdminLogin from "../pages/admin/AdminLogin";
import ManageOrganizations from "../pages/admin/ManageOrganizations";
import ManageBreeds from "../pages/admin/ManageBreeds";
import ManageAnimals from "../pages/admin/ManageAnimals";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageServices from "../pages/admin/ManageServices";
import ManageHomeSlider from "../pages/admin/ManageHomeSlider";
import NotificationsSection from "../pages/admin/NotificationsSection";
import ManageProducts from "../pages/admin/ManageProducts";
import ManageOrders from "../pages/admin/ManageOrders";

export const adminRoutes = [
  <Route path="/admin" element={<AdminLayout />} key="admin-layout">
    <Route index element={<AdminPanel />} />
    <Route path="pets" element={<ManagePets />} />
    <Route path="organizations" element={<ManageOrganizations />} />
    <Route path="breeds" element={<ManageBreeds />} />
    <Route path="animals" element={<ManageAnimals />} />
    <Route path="users" element={<ManageUsers />} />
    <Route path="services" element={<ManageServices />} key="admin-services" />
    <Route path="homeslider" element={<ManageHomeSlider />} key="admin-homeslider" />
    <Route path="notifications" element={<NotificationsSection />} key="admin-notifications" />
    <Route path="products" element={<ManageProducts />} key="admin-products" />
    <Route path="orders" element={<ManageOrders />} key="admin-orders" />
  </Route>,
  <Route path="/admin/login" element={<AdminLogin />} key="admin-login" />,
];