import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const funFacts = [
	{ fact: "Dogs have a sense of time and can miss their owners.", emoji: "🐶" },
	{ fact: "Cats can make over 100 different sounds.", emoji: "🐱" },
	{ fact: "Goldfish have a memory-span of at least three months.", emoji: "🐟" },
	{ fact: "Rabbits purr when they are content.", emoji: "🐰" },
	{ fact: "Parrots can live for over 60 years.", emoji: "🦜" },
];

function getRandomItems<T>(arr: T[], count: number): T[] {
	if (arr.length <= count) return arr;
	const shuffled = [...arr].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

const HomePage = () => {
	const [slides, setSlides] = useState<
		{ imageUrl: string; title: string; description: string; buttonText: string }[]
	>([]);
	const [currentSlide, setCurrentSlide] = useState(0);

	// Fetch slider
	useEffect(() => {
		const fetchSlider = async () => {
			try {
				const res = await fetch("https://localhost:7213/api/HomeSlider/GetBy/2");
				const data = await res.json();
				setSlides([
					{
						imageUrl: data.img1Url,
						title: data.title,
						description: data.description,
						buttonText: data.buttonText,
					},
					{
						imageUrl: data.img2Url,
						title: data.title,
						description: data.description,
						buttonText: data.buttonText,
					},
					{
						imageUrl: data.img3Url,
						title: data.title,
						description: data.description,
						buttonText: data.buttonText,
					},
				]);
			} catch (error) {
				setSlides([]);
			}
		};
		fetchSlider();
	}, []);

	useEffect(() => {
		if (slides.length < 2) return;
		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % slides.length);
		}, 5000);
		return () => clearInterval(interval);
	}, [slides]);

	const goToSlide = (idx: number) => setCurrentSlide(idx);

	// Fun Fact state
	const [factIdx, setFactIdx] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setFactIdx((prev) => (prev + 1) % funFacts.length);
		}, 4000);
		return () => clearInterval(interval);
	}, []);

	// Fetch organizations once
	const [organizations, setOrganizations] = useState<any[]>([]);
	const [randomClinics, setRandomClinics] = useState<any[]>([]);
	const [randomShops, setRandomShops] = useState<any[]>([]);
	const [randomShelters, setRandomShelters] = useState<any[]>([]);

	useEffect(() => {
		fetch("https://localhost:7213/api/Organization/getAll")
			.then((res) => res.json())
			.then((data) => {
				setOrganizations(data.items || data || []);
			})
			.catch(() => setOrganizations([]));
	}, []);

	// Helper to filter and randomize
	function randomizeAll(orgs: any[]) {
		const clinicsAll = orgs.filter((org) => org.organizationType?.toLowerCase() === "clinic");
		const shopsAll = orgs.filter((org) => org.organizationType?.toLowerCase() === "shop");
		const sheltersAll = orgs.filter((org) => org.organizationType?.toLowerCase() === "shelter");
		setRandomClinics(getRandomItems(clinicsAll, 3));
		setRandomShops(getRandomItems(shopsAll, 3));
		setRandomShelters(getRandomItems(sheltersAll, 3));
	}

	// Randomize on organizations load and every 1 minute
	useEffect(() => {
		if (organizations.length === 0) return;
		randomizeAll(organizations); // initial
		const interval = setInterval(() => randomizeAll(organizations), 60000); // every 1 min
		return () => clearInterval(interval);
	}, [organizations]);

	return (
		<div className="min-h-screen">
			{/* Home Slider Section */}
			<section className="relative h-[600px] flex items-center justify-center overflow-hidden">
				{slides.length > 0 && (
					<>
						<img
							src={slides[currentSlide].imageUrl}
							alt={`Slide ${currentSlide + 1}`}
							className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
							style={{ zIndex: 1, opacity: 0.7 }}
						/>
						<div className="relative z-10 text-center text-white px-4">
							<h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
								{slides[currentSlide].title}
							</h1>
							<p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-lg">
								{slides[currentSlide].description}
							</p>
							<Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-warm">
								<Heart className="mr-2 h-5 w-5" />
								{slides[currentSlide].buttonText || "Find a Pet"}
							</Button>
						</div>
						{/* Slider Controls */}
						<button
							className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 rounded-full p-2"
							onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
							aria-label="Previous Slide"
						>
							<ChevronLeft className="text-white h-6 w-6" />
						</button>
						<button
							className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 rounded-full p-2"
							onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
							aria-label="Next Slide"
						>
							<ChevronRight className="text-white h-6 w-6" />
						</button>
						{/* Dots */}
						<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
							{slides.map((_, idx) => (
								<button
									key={idx}
									className={`w-3 h-3 rounded-full ${idx === currentSlide ? "bg-primary" : "bg-white/50"}`}
									onClick={() => goToSlide(idx)}
									aria-label={`Go to slide ${idx + 1}`}
								/>
							))}
						</div>
					</>
				)}
			</section>

			{/* Fun Pet Facts */}
			<section className="py-12 bg-gradient-to-b from-white to-slate-50">
				<div className="container mx-auto px-4 flex flex-col items-center">
					<h2 className="text-3xl font-bold text-center mb-6 text-primary">
						Fun Pet Fact
					</h2>
					<div className="bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center max-w-xl w-full">
						<span className="text-5xl mb-4">{funFacts[factIdx].emoji}</span>
						<p className="text-lg text-center font-medium text-gray-700">
							{funFacts[factIdx].fact}
						</p>
					</div>
				</div>
			</section>

			{/* Register Your Pet */}
			<section className="py-12 bg-primary/5">
				<div className="container mx-auto px-4 flex flex-col items-center">
					<h2 className="text-3xl font-bold text-center mb-4 text-primary">
						Do you have pets?
					</h2>
					<p className="text-lg text-center mb-6 text-muted-foreground max-w-xl">
						Register your pet with us to keep their records safe, get reminders for vaccinations, and connect with other pet owners!
					</p>
					<Link to="/register-pet">
						<Button size="lg" className="bg-primary text-white hover:bg-primary/90 shadow-warm">
							Register Your Pet
						</Button>
					</Link>
				</div>
			</section>

			{/* Clinics Section */}
			<section className="py-10">
				<div className="container mx-auto px-4">
					<h2 className="text-2xl font-bold mb-6 text-primary">Clinics</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{randomClinics.length === 0 ? (
							<div className="col-span-full text-center text-muted-foreground">No clinics found.</div>
						) : (
							randomClinics.map((clinic: any) => (
								<div key={clinic.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
									<img
										src={clinic.imageUrl || "https://placekitten.com/300/200"}
										alt={clinic.name}
										className="w-full h-40 object-cover rounded mb-3"
									/>
									<h3 className="text-lg font-semibold">{clinic.name}</h3>
									<p className="text-sm text-muted-foreground">{clinic.location}</p>
								</div>
							))
						)}
					</div>
				</div>
			</section>

			{/* Shops Section */}
			<section className="py-10 bg-slate-50">
				<div className="container mx-auto px-4">
					<h2 className="text-2xl font-bold mb-6 text-primary">Pet Shops</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{randomShops.length === 0 ? (
							<div className="col-span-full text-center text-muted-foreground">No shops found.</div>
						) : (
							randomShops.map((shop: any) => (
								<div key={shop.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
									<img
										src={shop.imageUrl || "https://placekitten.com/302/200"}
										alt={shop.name}
										className="w-full h-40 object-cover rounded mb-3"
									/>
									<h3 className="text-lg font-semibold">{shop.name}</h3>
									<p className="text-sm text-muted-foreground">{shop.location}</p>
								</div>
							))
						)}
					</div>
				</div>
			</section>

			{/* Shelters Section */}
			<section className="py-10">
				<div className="container mx-auto px-4">
					<h2 className="text-2xl font-bold mb-6 text-primary">Shelters</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{randomShelters.length === 0 ? (
							<div className="col-span-full text-center text-muted-foreground">No shelters found.</div>
						) : (
							randomShelters.map((shelter: any) => (
								<div key={shelter.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
									<img
										src={shelter.imageUrl || "https://placekitten.com/304/200"}
										alt={shelter.name}
										className="w-full h-40 object-cover rounded mb-3"
									/>
									<h3 className="text-lg font-semibold">{shelter.name}</h3>
									<p className="text-sm text-muted-foreground">{shelter.location}</p>
								</div>
							))
						)}
					</div>
				</div>
			</section>
		</div>
	);
};

export default HomePage;