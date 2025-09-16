import { Dialog } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeCheck, Flame, PawPrint, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type MemberSubscriptionPlan = {
  updatedDate: any;
  id: number;
  planType: string;
  name: string;
  price: number;
  petLimit?: number;
  tinderLimit?: number;
  clinicLimit?: number;
  isUnlimited: boolean;
  description: string;
};

const ICONS: Record<string, JSX.Element> = {
  None: <PawPrint className="h-6 w-6 text-gray-400" />,
  PawStart: <BadgeCheck className="h-6 w-6 text-blue-400" />,
  PawPlus: <Flame className="h-6 w-6 text-green-400" />,
  PawElite: <Star className="h-6 w-6 text-yellow-400" />,
};

const COLORS: Record<string, string> = {
  None: "border-gray-300",
  PawStart: "border-blue-400",
  PawPlus: "border-green-400",
  PawElite: "border-yellow-400",
};

const API_BASE = import.meta.env.VITE_API_URL;

const getToken = () => {
  try {
    const authRaw = sessionStorage.getItem("auth");
    if (!authRaw) return "";
    const authObj = JSON.parse(authRaw);
    // Əgər authObj.state varsa, tokeni ordan götür
    if (authObj.state && authObj.state.token) return authObj.state.token;
    // Əgər birbaşa token varsa, onu götür
    if (authObj.token) return authObj.token;
    return "";
  } catch {
    return "";
  }
};

const MemberSubscriptionPlanPage = () => {
  const token = getToken();
  const [plans, setPlans] = useState<MemberSubscriptionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<MemberSubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch all plans
    fetch(`${API_BASE}/api/MemberSubscription/getAll`)
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (!token) {
      setActivePlan(null);
      setLoading(false);
      console.log("Token yoxdur!");
      return;
    }
    fetch(`${API_BASE}/api/MemberSubscription/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("Status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("Aktiv plan cavabı:", data);
          setActivePlan(data);
        } else {
          const err = await res.text();
          console.log("Xəta cavabı:", err);
          setActivePlan(null);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleBuy = async (planId: number) => {
    const res = await fetch(`${API_BASE}/api/MemberSubscription/buy?planId=${planId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      toast({
        title: "Plan aktivləşdirildi!",
        description: "Yeni üzvlük planınız uğurla aktiv oldu.",
        variant: "default", // success, destructive, default
        duration: 4000,
        className: "bg-green-100 border-green-400 text-green-800 font-semibold",
      });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const err = await res.text();
      toast({
        title: "Xəta!",
        description: err,
        variant: "destructive",
        duration: 4000,
        className: "bg-red-100 border-red-400 text-red-800 font-semibold",
      });
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/MemberSubscription/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const msg = await res.text();
        toast({
          title: "Plan ləğv edildi!",
          description: msg,
          variant: "default",
          duration: 4000,
          className: "bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold",
        });
        // Aktiv planı yenidən fetch et
        fetch(`${API_BASE}/api/MemberSubscription/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setActivePlan(data);
            } else {
              setActivePlan(null);
            }
          });
      } else {
        const err = await res.text();
        toast({
          title: "Xəta!",
          description: err,
          variant: "destructive",
          duration: 4000,
          className: "bg-red-100 border-red-400 text-red-800 font-semibold",
        });
      }
    } finally {
      setCancelLoading(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-primary">Üzvlük Planları</h1>
      {/* Aktiv plan varsa, yuxarıda göstər */}
      {!loading && activePlan ? (
        <div className="mb-8 p-4 rounded-lg border-2 border-green-400 bg-green-50 flex flex-col md:flex-row items-center gap-4">
          {ICONS[activePlan.planType?.toString() ?? "None"] || <PawPrint className="h-6 w-6 text-gray-400" />}
          <span className="text-lg font-semibold text-green-700">
            Aktiv planınız: <span className="font-bold">{activePlan.name}</span>
          </span>
          {/* Bitmə müddəti və qalan günlər */}
          {activePlan.updatedDate && (
            <span className="ml-4 text-base text-green-700">
              Bitmə müddəti:{" "}
              <span className="font-bold">
                {new Date(activePlan.updatedDate).toLocaleDateString()}
              </span>
              {/* Qalan günləri göstər */}
              {(() => {
                const endDate = new Date(activePlan.updatedDate);
                const now = new Date();
                const diffMs = endDate.getTime() - now.getTime();
                const diffDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
                return (
                  <span className="ml-2 text-green-700">
                    ({diffDays} gün qalıb)
                  </span>
                );
              })()}
            </span>
          )}
          {/* Planı ləğv et düyməsi */}
          <Button
            variant="destructive"
            className="ml-auto"
            onClick={async () => {
              if (window.confirm("Planı ləğv etmək istədiyinizə əminsiniz?")) {
                await handleCancel();
              }
            }}
          >
            Planı ləğv et
          </Button>
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50 text-yellow-700 font-semibold">
          Aktiv üzvlük planınız yoxdur. Aşağıdakı planlardan birini seçə bilərsiniz:
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const type = plan.planType?.toString() ?? "None";
          const isActive = activePlan && activePlan.id === plan.id;
          return (
            <Card
              key={plan.name}
              className={`border-2 ${COLORS[type] || "border-gray-300"} shadow-sm`}
            >
              <CardHeader className="flex flex-col items-center">
                {ICONS[type] || <PawPrint className="h-6 w-6 text-gray-400" />}
                <CardTitle className="mt-2 text-xl font-bold">
                  {plan.name}
                </CardTitle>
                <div className="mt-2 text-lg font-semibold text-primary">
                  {plan.price > 0 ? `${plan.price} ₼ / ay` : "Ödənişsiz"}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-2">
                  <li>
                    💬 Həkim görüşləri:{" "}
                    {plan.isUnlimited
                      ? "Limitsiz klinika görüşü"
                      : plan.clinicLimit
                      ? `Aylıq ${plan.clinicLimit} klinika görüşü`
                      : "1 illik 1 klinika görüşü"}
                  </li>
                  <li>
                    🔥 Pet Tinder:
                    <ul className="list-disc ml-6 mt-2 text-[15px] space-y-1">
                      <li>
                        {plan.isUnlimited
                          ? "Limitsiz baxış və bütün filterlərə giriş"
                          : plan.tinderLimit
                          ? `Gündəlik ${plan.tinderLimit} heyvan baxışı`
                          : "Gündəlik 5 heyvan baxışı"}
                      </li>
                      {type === "PawStart" && (
                        <li> Yalnız heyvan növü üzrə seçim</li>
                      )}
                      {type === "PawPlus" && (
                        <li> Heyvanın breed-i üzrə seçim</li>
                      )}
                      {type === "PawElite" && (
                        <>
                          <li> Cins, breed, yaş və s. üzrə filterlər</li>
                          <li> Limitsiz baxış</li>
                        </>
                      )}
                    </ul>
                  </li>
                  <li>
                    🐕 Hesabınızdakı heyvan limiti:{" "}
                    {plan.isUnlimited
                      ? "Limitsiz pet əlavə"
                      : plan.petLimit
                      ? `${plan.petLimit} pet əlavə limiti`
                      : "1 pet əlavə limiti"}
                  </li>
                  {type === "PawElite" && (
                    <>
                      <li>🏆 VIP Badge: PetConnect-də VIP status</li>
                      <li>
                        💌 Priority Matchmaking: Algoritm daha uyğun eşleşmələr göstərir
                      </li>
                      <li>
                        📦 Exclusive Offers: Pet mağazalarından xüsusi endirimlər və məhsullar
                      </li>
                    </>
                  )}
                </ul>
                {/* Əgər plan aktiv deyilsə, "Al" düyməsi göstər */}
                {!isActive && (
                  <Button
                    className="mt-6 w-full"
                    variant="default"
                    onClick={() => handleBuy(plan.id)}
                  >
                    Planı seç
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MemberSubscriptionPlanPage;