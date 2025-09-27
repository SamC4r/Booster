'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, ShoppingCart, Search, Filter, Crown, Palette, Sparkles, BadgeCheck, Zap, Star, Heart, Rocket, Lock, Check, Boxes, Plus, PlusCircle, Box, Wallet, Landmark, X, Video, CreditCard } from "lucide-react"
import { XpIndicator } from "@/modules/xp/ui/components/xp-indicator"
import { trpc } from "@/trpc/client"
import { useAuth, useClerk } from "@clerk/nextjs"
import { compactNumber } from "@/lib/utils"

const LOOKUP_KEYS = ["xp_500","xp_1200","xp_2500","xp_5500","xp_10000","xp_50000"];

enum lookupKeys{
  "xp_500","xp_1200","xp_2500","xp_5500","xp_10000","xp_50000"
}

export const MarketSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [ownedItems, setOwnedItems] = useState([1, 6]) // IDs of owned items
  const [showXpPopup, setShowXpPopup] = useState(false)

  const { userId: clerkUserId } = useAuth();
  const clerk = useClerk();
  const { data: user } = trpc.users.getByClerkId.useQuery({
    clerkId: clerkUserId,
  });
  const userId = user?.id;
  const { data: myXp } = trpc.xp.getXpByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  );

  const utils = trpc.useUtils();

  const buy = trpc.xp.buyById.useMutation({
    onSuccess: () => {
      utils.xp.getXpByUserId.invalidate({ userId });
    }
  })

  const addXp = trpc.xp.buyXp.useMutation({
    onSuccess: () => {
      utils.xp.getXpByUserId.invalidate({ userId });
      setShowXpPopup(false);
    }
  })

  const userCoins = myXp?.xp || 0;

  // Marketplace items data
  const marketplaceItems = [
    { id: 1, name: "Golden Crown", price: 500, category: "icons", image: "👑", rarity: "epic" },
    { id: 2, name: "Rainbow Background", price: 300, category: "backgrounds", image: "🌈", rarity: "rare" },
    { id: 3, name: "Neon Border", price: 250, category: "borders", image: "🔆", rarity: "rare" },
    { id: 4, name: "Verified Badge", price: 1000, category: "badges", image: "✅", rarity: "legendary" },
    { id: 5, name: "Fire Effect", price: 750, category: "effects", image: "🔥", rarity: "epic" },
    { id: 6, name: "Silver Star", price: 150, category: "icons", image: "⭐", rarity: "common" },
    { id: 7, name: "Gradient Text", price: 400, category: "text", image: "🎨", rarity: "rare" },
    { id: 8, name: "Animated Avatar", price: 1200, category: "effects", image: "✨", rarity: "legendary" },
    { id: 9, name: "Diamond Frame", price: 600, category: "frames", image: "💎", rarity: "epic" },
    { id: 10, name: "Special Color Pack", price: 350, category: "colors", image: "🎯", rarity: "rare" },
    { id: 11, name: "Exclusive Badge", price: 900, category: "badges", image: "🛡️", rarity: "epic" },
    { id: 12, name: "Premium Theme", price: 800, category: "themes", image: "🌠", rarity: "legendary" },
  ]

  // Filter items based on category and search
  const filteredItems = marketplaceItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle purchasing an item
  const handlePurchase = (itemId: number, price: number) => {
    if (userCoins >= price) {
      buy.mutate({ price });
      setOwnedItems(prev => [...prev, itemId])
    } else {
      setShowXpPopup(true);
    }
  }

  // Handle rewarded ad
  const handleWatchAd = () => {
    // Simulate ad watching process
    // In a real app, you'd integrate with an ad network like Google AdMob
    console.log("Starting rewarded ad...");

    // Simulate ad completion after 3 seconds
    // setTimeout(() => {
    //   addXp.mutate({ userId: userId!, amount: 100 }); // Give 100 XP for watching ad
    // }, 3000);
  }

  const buyXp = trpc.xp.buyXp.useMutation();

  // Handle purchase of Xp with 
  const handlePurchaseXp = async (lookupKey: "xp_500" | "xp_1200"|"xp_2500"|"xp_5500"|"xp_10000"|"xp_50000" ) => {
    console.log("AA")
    const { url } = await buyXp.mutateAsync({ priceLookupKey: lookupKey });
    window.location.href = url!;
  };


  // xp purchase options
  const xpPackages: { amount:number; price:number; popular:boolean; lookup: "xp_500" | "xp_1200"|"xp_2500"|"xp_5500"|"xp_10000"|"xp_50000" }[] = [
    { amount: 500, price: 1.99, popular: false, lookup: "xp_500" },
    { amount: 1200, price: 3.99, popular: false, lookup: "xp_1200"  },
    { amount: 2500, price: 7.99, popular: true, lookup: "xp_2500"  },
    { amount: 5500, price: 15.99, popular: false, lookup: "xp_5500"  },
    { amount: 10000, price: 25.99, popular: false, lookup: "xp_10000"  },
    { amount: 50000, price: 70.99, popular: false, lookup: "xp_50000"  },
  ]

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Items", icon: <Sparkles className="h-4 w-4" /> },
    { id: "icons", name: "Icons", icon: <Star className="h-4 w-4" /> },
    { id: "badges", name: "Badges", icon: <BadgeCheck className="h-4 w-4" /> },
    { id: "backgrounds", name: "Backgrounds", icon: <Palette className="h-4 w-4" /> },
    { id: "effects", name: "Effects", icon: <Zap className="h-4 w-4" /> },
    { id: "colors", name: "Colors", icon: <Palette className="h-4 w-4" /> },
    { id: "frames", name: "Frames", icon: <Heart className="h-4 w-4" /> },
    { id: "themes", name: "Themes", icon: <Sparkles className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#1a1a1a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ffca55] to-[#FFA100] bg-clip-text text-transparent">
              Customization Marketplace
            </h1>
            <p className="text-gray-400 mt-2">Personalize your profile with exclusive items</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* XP INDICATOR */}
            <XpIndicator xp={userCoins} />
            <Button
              className="flex rounded-full bg-gradient-to-r from-[#ffca55] to-[#FFA100] text-gray-900 font-semibold hover:opacity-90"
              onClick={() => setShowXpPopup(true)}
            >
              <Landmark className="h-4 w-4" />
              Get More XP
            </Button>
          </div>
        </div>

        {/* XP Popup Modal */}
        {showXpPopup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] rounded-2xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ffca55] to-[#FFA100] bg-clip-text text-transparent">
                  Get More XP
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowXpPopup(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Current Balance */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Balance:</span>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-purple-500" />
                    <span className="text-xl font-bold">{Intl.NumberFormat("en").format(userCoins)} XP</span>
                  </div>
                </div>
              </div>

              {/* Free Option - Rewarded Ads */}
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-400" />
                  Free XP - Watch Ads
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Watch a short video ad to earn 35 XP for free!
                </p>
                <Button
                  onClick={handleWatchAd}
                  // disabled={addXp.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {/* {addXp.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Watching Ad...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Watch Ad & Get 100 XP
                    </div>
                  )} */}
                </Button>
              </div>

              {/* Paid Options */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  Buy XP Packages
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Get instant XP with these premium packages
                </p>

                <div className="space-y-3">
                  {xpPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${pkg.popular
                          ? "border-purple-500 bg-gradient-to-r from-purple-700/10 to-purple-100/10"
                          : "border-gray-600 bg-[#252525] hover:border-gray-500"
                        }`}
                      onClick={() => handlePurchaseXp(pkg.lookup)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-purple-500 text-gray-900 text-xs px-2 py-1 rounded-full font-semibold">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Boxes className="h-6 w-6 text-purple-500" />
                          <div>
                            <div className="font-semibold text-lg">{pkg.amount.toLocaleString()} XP</div>
                            <div className="text-gray-400 text-sm">Instant delivery</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${pkg.price}</div>
                          <div className="text-gray-400 text-sm">
                            ${(pkg.price / (pkg.amount / 1000)).toFixed(2)} per 1K XP
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security Note */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Lock className="h-3 w-3" />
                    <span>Secure payment processing. Your transaction is safe and encrypted.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-full bg-[#252525] border border-gray-700 focus:border-[#ffca55] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-full bg-[#252525] border border-gray-700 text-white px-3 py-2 text-sm focus:border-[#ffca55] focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${selectedCategory === category.id
                    ? "bg-gradient-to-r from-[#ffca55] to-[#FFA100] text-gray-900"
                    : "bg-[#252525] text-gray-300 hover:bg-[#2d2d2d]"
                  }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const isOwned = ownedItems.includes(item.id)

            return (
              <Card
                key={item.id}
                className="bg-[#1e1e1e] border border-gray-800 overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#ffca55]/10"
              >
                <CardContent className="p-0">
                  {/* Item Image */}
                  <div className="h-40 flex items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] relative">
                    <span className="text-5xl">{item.image}</span>

                    {/* Rarity Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${item.rarity === "common" ? "bg-gray-600" :
                            item.rarity === "rare" ? "bg-blue-600" :
                              item.rarity === "epic" ? "bg-purple-600" : "bg-yellow-600"
                          }`}
                      >
                        {item.rarity}
                      </span>
                    </div>

                    {/* Owned Badge */}
                    {isOwned && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Owned
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {item.price < 500 ? (
                          <Box className="h-4 w-4 text-purple-400 mr-1" />
                        ) : (
                          <Boxes className="h-5 w-5 text-purple-600 mr-1" />
                        )}
                        <span className="font-semibold">{item.price}</span>
                      </div>

                      {isOwned ? (
                        <Button
                          className="rounded-full bg-green-600 text-white text-sm hover:bg-green-700"
                          disabled
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Owned
                        </Button>
                      ) : (
                        <Button
                          className="rounded-full bg-gradient-to-r from-[#ffca55] to-[#FFA100] text-gray-900 text-sm hover:opacity-90"
                          onClick={() => handlePurchase(item.id, item.price)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-300">No items found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
          </div>
        )}


        {/* Featured Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Crown className="h-6 w-6 text-[#ffca55]" />
            Featured Items
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-800 p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl">🌟</div>
              <div>
                <h3 className="text-xl font-bold">Premium Creator Pack</h3>
                <p className="text-gray-300 mt-2">Get access to exclusive items and special features</p>
                <div className="flex items-center mt-4">
                  <Coins className="h-5 w-5 text-[#ffca55] mr-2" />
                  <span className="font-semibold">2,500</span>
                  <Button className="ml-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90">
                    <Rocket className="h-4 w-4 mr-2" />
                    Unlock Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl border border-blue-800 p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl">⚡</div>
              <div>
                <h3 className="text-xl font-bold">Weekly Special Offer</h3>
                <p className="text-gray-300 mt-2">Limited time offer - 50% off on all effects</p>
                <div className="flex items-center mt-4">
                  <Boxes className="h-5 w-5 text-[#ffca55] mr-2" />
                  <span className="font-semibold line-through text-gray-400">1,500</span>
                  <span className="font-semibold ml-2">750</span>
                  <Button className="ml-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90">
                    <Zap className="h-4 w-4 mr-2" />
                    Claim Offer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}