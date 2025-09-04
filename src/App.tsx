import { Toaster } from "@/components/ui/toaster";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import SheltersPage from "./pages/SheltersPage";
import ClinicsPage from "./pages/ClinicsPage";
import PetShopsPage from "./pages/PetShopsPage";
import NotFound from "./pages/NotFound";
import ShopDetail from "./pages/ShopDetail";
import ClinicDetail from "./pages/ClinicDetail";
import ShelterDetail from "./pages/ShelterDetail";
import AddProductPage from "./pages/AddProductPage";
import MyProductsPage from "./pages/MyProductsPage";
import Profile from "@/pages/Profile";
import MyPets from "@/pages/MyPets";
import Cart from "@/pages/Cart";
import ShopOrdersPage from "@/pages/ShopOrdersPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import { adminRoutes } from "./routes/adminRoutes";
import SupportChatbot from "@/components/SupportChatbot";
import ForgetPasswordPage from "./pages/ForgetPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage"; 
import ResetEmailPage from "./pages/ResetEmailPage"; 
import MyOrdersPage from "@/pages/MyOrdersPage";
import PairPetPage from "./pages/PairPetPage";
import MemberSubscriptionPlan from "./pages/MemberSubscriptionPlan";
const queryClient = new QueryClient();

export function ApiClientTokenSync() {
  const token = useAuth((state) => state.token);

  useEffect(() => {
    apiClient.setToken(token);
  }, [token]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ApiClientTokenSync />
        <BrowserRouter>
          <Routes>
            {/* Website pages with navigation */}
            <Route
              path="*"
              element={
                <>
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/shelters" element={<SheltersPage />} />
                    <Route path="/clinics" element={<ClinicsPage />} />
                    <Route path="/petshops" element={<PetShopsPage />} />
                    <Route path="/shop-detail" element={<ShopDetail />} />
                    <Route path="/clinic-detail" element={<ClinicDetail />} />
                    <Route path="/shelter-detail" element={<ShelterDetail />} />
                    <Route path="/shelter-detail/:id" element={<ShelterDetail />} />
                    <Route path="/add-product" element={<AddProductPage />} />
                    <Route path="/my-products" element={<MyProductsPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/mypets" element={<MyPets />} />
                    <Route path="/shopdetail/:id" element={<ShopDetail />} />
                    <Route path="/clinicdetail/:id" element={<ClinicDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/shop-orders/:shopId" element={<ShopOrdersPage />} />
                    <Route path="/shop-orders" element={<ShopOrdersPage />} />
                    <Route path="/appointments" element={<AppointmentsPage />} />
                    <Route path="/forget-password" element={<ForgetPasswordPage />} />
                    <Route path="/reset-email" element={<ResetEmailPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* səhv! */}
                    <Route path="/myorders" element={<MyOrdersPage />} />
                    <Route path="/pair-pet" element={<PairPetPage />} />
                    <Route path="/member-subscription" element={<MemberSubscriptionPlan />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </>
              }
            />

            {/* Admin routes */}
            {adminRoutes}
          </Routes>
        </BrowserRouter>
        <SupportChatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
