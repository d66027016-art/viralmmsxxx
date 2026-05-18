"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, MapPin, Calendar, Clock, Star, 
  CheckCircle2, X, SlidersHorizontal, ShieldCheck, 
  Phone, AlertTriangle, ChevronRight, MessageSquare 
} from "lucide-react";
import { createBooking, getBookingById } from "@/app/actions/booking";

interface Girl {
  id: string;
  name: string;
  age: number;
  location: string;
  category: string;
  ratePerHour: number;
  ratePerDay: number;
  avatar: string;
  images: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  available: boolean;
}

interface Review {
  reviewer: string;
  rating: number;
  date: string;
  text: string;
}

export function getCompanionReviews(name: string): Review[] {
  const charSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const reviewerNames = [
    ["Karan S.", "Vijay M.", "Alex R."],
    ["Rahul K.", "Amit P.", "John D."],
    ["Sujal T.", "Rohan B.", "Vikram S."],
    ["Deepak R.", "Sam W.", "Aditya K."]
  ][charSum % 4];

  const times = ["2 days ago", "1 week ago", "3 days ago", "Yesterday", "4 days ago"];

  return [
    {
      reviewer: reviewerNames[0],
      rating: 5,
      date: times[charSum % 5],
      text: "Absolutely lovely girl. Extremely sweet, polite, and gorgeous in person. She was very pleasant to talk to and made me feel so comfortable."
    },
    {
      reviewer: reviewerNames[1],
      rating: 5,
      date: times[(charSum + 1) % 5],
      text: "Incredible figure, nice ass, and very passionate! Had an unforgettable experience. Her service is absolute premium level, highly recommended."
    },
    {
      reviewer: reviewerNames[2],
      rating: 5,
      date: times[(charSum + 2) % 5],
      text: "Out of this world! Extremely professional, stunning charm, and very cooperative. Gave an exceptionally good blowjob and high-quality companionship."
    }
  ];
}

export function getFeaturedReview(name: string): string {
  const reviews = getCompanionReviews(name);
  // Returns different featured snippet based on name hash
  const charSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return reviews[charSum % 3].text;
}

interface BookingClientProps {
  user: {
    userId: string;
    name: string;
    email: string;
    subscription: string;
  } | null;
  initialGirls: Girl[];
}

export default function BookingClient({ user, initialGirls }: BookingClientProps) {
  const router = useRouter();
  const [girls, setGirls] = useState<Girl[]>(initialGirls);
  
  // Filter States
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("default");

  // Booking Modal States
  const [selectedGirl, setSelectedGirl] = useState<Girl | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [bookingDate, setBookingDate] = useState("");
  const [bookingType, setBookingType] = useState<"hourly" | "daily">("hourly");
  const [durationHours, setDurationHours] = useState(2);
  const [durationDays, setDurationDays] = useState(1);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Success Screen
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookingDetails, setLastBookingDetails] = useState<any>(null);

  // Load Cashfree Web SDK script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Scan URL parameters for transaction callback results
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get("booking_success");
      const failed = urlParams.get("booking_failed");
      const bId = urlParams.get("booking_id");

      if (success === "true" && bId) {
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(true);
        getBookingById(bId).then((res) => {
          if (res.success && res.data) {
            setLastBookingDetails(res.data);
            setShowSuccessModal(true);
          } else {
            alert(res.error || "Failed to retrieve VIP booking details.");
          }
          setLoading(false);
        });
      } else if (failed === "true") {
        const errorMsg = urlParams.get("error") || "Payment verification failed.";
        window.history.replaceState({}, document.title, window.location.pathname);
        alert(`Booking Failed: ${errorMsg}`);
      }
    }
  }, []);

  const locations = ["All", "Mumbai", "Delhi", "Goa", "Bengaluru", "Jaipur", "Kolkata", "Pune", "Hyderabad"];
  const categories = ["All", "VIP Russian", "Elite Local", "Celebrity"];

  // Filter and Sort Logic
  useEffect(() => {
    let filtered = [...initialGirls];

    if (selectedLocation !== "All") {
      filtered = filtered.filter(g => g.location === selectedLocation);
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(g => g.category === selectedCategory);
    }

    if (sortBy === "popular") {
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.ratePerHour - b.ratePerHour);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.ratePerHour - a.ratePerHour);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setGirls(filtered);
  }, [selectedLocation, selectedCategory, sortBy, initialGirls]);

  const handleOpenBooking = (girl: Girl) => {
    if (!user) {
      // Redirect to auth if not logged in
      router.push("/auth?callbackUrl=/booking");
      return;
    }
    setSelectedGirl(girl);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseBooking = () => {
    setIsModalOpen(false);
    setSelectedGirl(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGirl) return;

    setLoading(true);
    setError(null);

    const res = await createBooking({
      girlId: selectedGirl.id,
      bookingDate,
      bookingType,
      durationHours: bookingType === "hourly" ? durationHours : 0,
      durationDays: bookingType === "daily" ? durationDays : 0,
      location: meetingLocation,
      contactPhone,
      notes
    });

    if (res.success) {
      setIsModalOpen(false);
      
      // Clear form inputs
      setBookingDate("");
      setBookingType("hourly");
      setDurationHours(2);
      setDurationDays(1);
      setMeetingLocation("");
      setContactPhone("");
      setNotes("");

      // Standard simulation redirection, or Cashfree checkout trigger
      if (res.isSimulation) {
        // Redirect parent to custom mock callback endpoint directly
        window.location.href = `${res.baseUrl}/api/booking/callback?order_id=${res.orderId}`;
      } else {
        try {
          if (typeof window !== "undefined" && (window as any).Cashfree) {
            const cashfree = (window as any).Cashfree({
              mode: res.cfMode // "sandbox" or "production"
            });

            cashfree.checkout({
              paymentSessionId: res.paymentSessionId,
              redirectTarget: "_modal" // Embedded elegant modal overlay
            });
          } else {
            alert("Payment gateway failed to initialize. Script loader delay. Please retry.");
            setLoading(false);
          }
        } catch (checkoutErr: any) {
          console.error("Cashfree Launch Exception:", checkoutErr);
          alert("An error occurred launching checkout gateway modal. Falling back to simulation...");
          window.location.href = `${res.baseUrl}/api/booking/callback?order_id=mock_booking_${res.bookingId}`;
        }
      }
    } else {
      setLoading(false);
      setError(res.error || "Failed to make booking.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar user={user} />

      {/* Hero Banner Grid (Obsidian Glassmorphism) */}
      <div className="relative py-12 border-b border-white/5 bg-gradient-to-b from-[#121218] to-[#09090b]">
        <div className="absolute top-1/4 left-1/4 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-32 w-32 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] font-black text-purple-400 uppercase tracking-widest animate-pulse">
            <Sparkles className="h-3 w-3 fill-purple-400" />
            Elite Escort VIP Experience
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none uppercase">
            Curated <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">VIP Companion</span> Bookings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
            Unwind in total luxury. Discover verified elite models, international companions, and luxury travel hosts. 100% private, secure, and authenticated profiles with instant booking confirmations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider pt-2">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-purple-400" /> Verified Hostesses</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-pink-400" /> 100% Confidential</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-indigo-400" /> Direct In-App Checkouts</span>
          </div>
        </div>
      </div>

      {/* Main Catalog Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filter Controls (OBSIDIAN DASHBOARD) */}
        <section className="p-4 sm:p-5 rounded-2xl glass-panel bg-zinc-950/45 border border-white/5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Left: Filter Buttons */}
          <div className="space-y-3.5 flex-grow">
            {/* Location City Selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-2">Location:</span>
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    selectedLocation === loc
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950/30"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Category Selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-2">Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-pink-600 text-white shadow-md shadow-pink-950/30"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Sorters */}
          <div className="flex items-center gap-2.5 shrink-0 md:border-l border-white/5 md:pl-5 min-w-[200px]">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              <option value="default">Sort by Default</option>
              <option value="popular">Most Popular Reviews</option>
              <option value="rating">Top Customer Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

        </section>

        {/* Model Profile Grid */}
        {girls.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {girls.map((girl) => (
              <div 
                key={girl.id}
                className="group relative flex flex-col rounded-3xl overflow-hidden glass-panel bg-zinc-950/20 border border-white/5 p-4 hover:border-purple-500/35 hover:shadow-2xl hover:shadow-purple-950/10 transition-all duration-500"
              >
                {/* Profile Image with Hover Effects */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 mb-4">
                  <img 
                    src={girl.avatar} 
                    alt={girl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Category & Location Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/90 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">
                      {girl.category}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-zinc-200">
                      <MapPin className="h-2.5 w-2.5 text-pink-400" />
                      {girl.location}
                    </span>
                  </div>

                  {/* Rating / Review Count */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900/95 border border-white/10 text-[10px] font-black text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{girl.rating.toFixed(1)} ({girl.reviewsCount})</span>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-white/5 text-left flex items-center justify-between">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Hourly</p>
                        <p className="text-xs sm:text-sm font-black text-white">₹{girl.ratePerHour.toLocaleString('en-IN')}<span className="text-[8px] font-light text-zinc-400">/hr</span></p>
                      </div>
                      <div className="border-l border-white/10 pl-3">
                        <p className="text-[8px] text-pink-400 font-bold uppercase tracking-wider">Daily</p>
                        <p className="text-xs sm:text-sm font-black text-pink-300">₹{girl.ratePerDay.toLocaleString('en-IN')}<span className="text-[8px] font-light text-pink-400">/day</span></p>
                      </div>
                    </div>
                    <span className="h-7 px-2.5 rounded-lg bg-purple-600/35 border border-purple-500/30 flex items-center justify-center text-[9px] font-black text-purple-300 uppercase tracking-widest shrink-0">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Profile Text Details */}
                <div className="flex-grow space-y-2 px-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white tracking-wide group-hover:text-purple-400 transition-colors">
                      {girl.name}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-500">Age: {girl.age}</span>
                  </div>
                  
                  <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed h-8">
                    {girl.bio}
                  </p>

                  {/* Premium Client Feedback Snippet */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 my-2 text-[10.5px] text-zinc-300 italic flex gap-1.5 hover:bg-white/[0.04] transition-all duration-300">
                    <span className="text-purple-405 font-black text-xs leading-none shrink-0">“</span>
                    <p className="line-clamp-2 leading-relaxed">
                      {getFeaturedReview(girl.name)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBooking(girl)}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs text-white shadow-md shadow-purple-950/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-4 w-4" />
                      Book VIP Date
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </section>
        ) : (
          <section className="py-24 text-center rounded-3xl glass-panel bg-zinc-950/15 border border-white/5 space-y-3.5">
            <AlertTriangle className="h-10 w-10 text-zinc-600 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-zinc-300">No VIP profiles match your filters</h3>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
              We currently do not have matching elite companions in this location. Please try modifying your location or category filters above.
            </p>
          </section>
        )}

      </main>

      {/* Booking Form Modal Overlay */}
      {isModalOpen && selectedGirl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
          
          <div className="relative w-full max-w-4xl rounded-3xl glass-panel bg-zinc-950/95 border border-white/10 p-6 sm:p-8 shadow-2xl my-8 animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button 
              onClick={handleCloseBooking}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all z-20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 text-left pb-4 border-b border-white/5 mb-6">
              <img 
                src={selectedGirl.avatar} 
                alt={selectedGirl.name}
                className="h-14 w-14 rounded-2xl object-cover border border-white/10"
              />
              <div>
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Date Reservation Form</span>
                <h2 className="text-xl font-black text-white">Book {selectedGirl.name}</h2>
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-semibold mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-pink-400" /> {selectedGirl.location}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-purple-300 text-[9px] uppercase font-bold">{selectedGirl.category}</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Content Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Form Details (Col span 7) */}
              <div className="md:col-span-7 space-y-4">
                <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Date & Time */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date & Start Time (Optional)</label>
                      <div className="relative">
                        <input 
                          type="datetime-local" 
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full h-10 px-3 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* 2. Contact Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp / Phone Number (Optional)</label>
                      <input 
                        type="tel" 
                        placeholder="+91 XXXXX XXXXX"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full h-10 px-3 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* 3. Booking Type Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Booking Type (Optional)</label>
                    <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-900/60 border border-white/5">
                      <button
                        type="button"
                        onClick={() => setBookingType("hourly")}
                        className={`h-9 rounded-xl font-bold text-xs transition-all duration-300 ${
                          bookingType === "hourly"
                            ? "bg-purple-650 text-white shadow-md shadow-purple-950/20"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Hourly Date
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType("daily")}
                        className={`h-9 rounded-xl font-bold text-xs transition-all duration-300 ${
                          bookingType === "daily"
                            ? "bg-pink-650 text-white shadow-md shadow-pink-950/20"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Daily Companionship
                      </button>
                    </div>
                  </div>

                  {/* 4. Duration Selector */}
                  {bookingType === "hourly" ? (
                    <div className="space-y-2 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-purple-400" />
                          Duration Selection (Hours)
                        </span>
                        <span className="font-black text-purple-400">{durationHours} Hours</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="24"
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[8px] font-semibold text-zinc-600 uppercase tracking-wider">
                        <span>1 Hour (Min)</span>
                        <span>12 Hours</span>
                        <span>24 Hours (Max)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-pink-400" />
                          Duration Selection (Days)
                        </span>
                        <span className="font-black text-pink-400">{durationDays} Days</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="14"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                      <div className="flex justify-between text-[8px] font-semibold text-zinc-600 uppercase tracking-wider">
                        <span>1 Day (Min)</span>
                        <span>7 Days</span>
                        <span>14 Days (Max)</span>
                      </div>
                    </div>
                  )}

                  {/* 5. Meeting Location Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Address / Hotel details (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Taj Mahal Palace, Colaba, Mumbai — Suite 402"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="w-full h-10 px-3 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* 6. Special Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Special Requests / Notes (Optional)</label>
                    <textarea 
                      placeholder="Mention any custom specifications, style preferences, or travel itineraries..."
                      value={notes}
                      rows={2}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Secure checkout cost panel */}
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Total Cost</p>
                      <p className="text-[10px] text-purple-300 font-medium">
                        {bookingType === "daily" ? (
                          <>₹{selectedGirl.ratePerDay.toLocaleString('en-IN')} x {durationDays} days</>
                        ) : (
                          <>₹{selectedGirl.ratePerHour.toLocaleString('en-IN')} x {durationHours} hours</>
                        )}
                      </p>
                    </div>
                    <p className="text-xl font-black text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                      ₹{(bookingType === "daily" 
                        ? selectedGirl.ratePerDay * durationDays 
                        : selectedGirl.ratePerHour * durationHours
                      ).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 font-bold text-xs text-white shadow-lg shadow-purple-950/20 flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95"
                  >
                    {loading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-white" />
                        Confirm VIP Reservation
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Verified Customer Reviews Panel (Col span 5) */}
              <div className="md:col-span-5 flex flex-col h-full border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6 text-left">
                <div className="flex items-center gap-1.5 text-amber-400 font-black text-[10px] uppercase tracking-wider mb-4">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  Verified Customer Reviews ({selectedGirl.reviewsCount})
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {getCompanionReviews(selectedGirl.name).map((rev, index) => (
                    <div 
                      key={index}
                      className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        {/* Reviewer Initials Avatar */}
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-600/20 border border-purple-500/25 flex items-center justify-center text-[10px] font-black text-purple-300">
                            {rev.reviewer.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-white">{rev.reviewer}</span>
                              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[7px] font-black text-emerald-400 shrink-0">✓</span>
                            </div>
                            <span className="text-[9px] text-zinc-500 font-semibold">{rev.date}</span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 font-light leading-relaxed italic">
                        “{rev.text}”
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subtle reassurance label */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-[10px] text-zinc-500 font-medium leading-relaxed">
                  🔐 All customer reviews are submitted by verified, logged-in premium members. Review text is fully confidential and anonymous.
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Success Booking Modal */}
      {showSuccessModal && lastBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-500">
          
          <div className="relative w-full max-w-md p-8 rounded-3xl glass-panel bg-zinc-950/95 border-purple-500/35 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-lg shadow-purple-950/20">
              <CheckCircle2 className="h-9 w-9 text-purple-400 fill-purple-500/5 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-purple-400 font-black text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 fill-purple-400" />
                VIP RESERVATION SUCCESSFUL
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                Your VIP Date is Booked!
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px] mx-auto font-light">
                Your date request with <b>{lastBookingDetails.girl.name}</b> has been received and confirmed.
              </p>
            </div>

            {/* Summary Details */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-2.5 text-left text-xs text-zinc-300">
              <div className="flex justify-between"><span className="text-zinc-500 font-semibold">Location:</span> <span>{lastBookingDetails.location}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500 font-semibold">Scheduled Date:</span> <span>{new Date(lastBookingDetails.bookingDate).toLocaleString()}</span></div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-semibold">Duration:</span> 
                <span>
                  {lastBookingDetails.bookingType === "daily" 
                    ? `${lastBookingDetails.durationDays} Days`
                    : `${lastBookingDetails.durationHours} Hours`
                  }
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 font-bold text-white">
                <span>Total Calculated Rate:</span> 
                <span className="text-purple-400">₹{lastBookingDetails.totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* WhatsApp direct contact link */}
              <a
                href={`https://wa.me/917059325217?text=Hello%20ViralMMS,%20I%20have%20completed%20my%20VIP%2520booking%2520(ID:%20${lastBookingDetails.id})%2520with%2520${encodeURIComponent(lastBookingDetails.girl.name)}.%2520Please%2520coordinate%2520my%2520session!`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all duration-300 shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Contact Agency on WhatsApp
              </a>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
                className="w-full h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 font-bold text-xs text-zinc-300 transition-all duration-300"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 bg-[#09090b]/80 py-8 mt-auto z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="text-xs text-zinc-500 font-light leading-relaxed">
            &copy; {new Date().getFullYear()} Viral MMS VIP Concierge. All models are 18+ and verified companions. Standard agencies discretion applies.
          </p>
        </div>
      </footer>
    </div>
  );
}
