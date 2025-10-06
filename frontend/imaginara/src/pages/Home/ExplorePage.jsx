import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import LeftBar from '../../components/leftBar/LeftBar'; 
import ExploreTopBar from '../../components/topBar/ExploreTopBar';

const ExplorePage = ({ toggleSave, savedItems, onLogout }) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const observerTarget = useRef(null);

  // Base content
  const baseGalleryItems = [
    { id: 'a', title: 'Crimson Sunset', type: 'PHOTO', color: 'bg-red-500', saves: 120, comments: 15, size: 'small' },
    { id: 'b', title: 'Ode to Lost Time', type: 'POEM', color: 'bg-blue-100', saves: 45, comments: 5, size: 'text', author: 'mock_upl...', desc: 'The clock ticks backward, a phantom sound, Where all moments lost are never found...' },
    { id: 'c', title: 'Galactic Stew', type: 'STORY', color: 'bg-blue-100', saves: 200, comments: 40, size: 'text', author: 'mock_upl...', desc: 'A story about a chef who travels the stars, collecting ingredients from nebulae and asteroid fields.' },
    { id: 'd', title: 'Haiku: Ocean Deep', type: 'POEM', color: 'bg-blue-100', saves: 30, comments: 3, size: 'text', author: 'mock_upl...', desc: 'Blue vastness calls deep, Waves crash on the silent sand, Time forgets its edge.' },
    { id: 'e', title: 'The Final Note', type: 'STORY', color: 'bg-blue-100', saves: 88, comments: 14, size: 'text', author: 'mock_upl...', desc: 'She found the sheet music tucked into the attic box. It was a melody from a forgotten age.' },
    { id: 'f', title: 'The Abstract', type: 'ART', color: 'bg-blue-600', saves: 150, comments: 8, size: 'small' },
    { id: 'g', title: 'Forest Guardian', type: 'PHOTO', color: 'bg-green-600', saves: 310, comments: 22, size: 'tall', featured: 'Deep Forest Shot' },
    { id: 'h', title: 'Monochrome', type: 'PHOTO', color: 'bg-slate-800', saves: 180, comments: 18, size: 'medium', featured: 'B&W Street' },
    { id: 'i', title: 'Rusty Robot', type: 'ART', color: 'bg-orange-500', saves: 90, comments: 10, size: 'small', featured: 'Robot Toy' },
    { id: 'j', title: 'Expressive Oil', type: 'ART', color: 'bg-yellow-500', saves: 110, comments: 9, size: 'medium', featured: 'Vibrant Colors' },
    { id: 'k', title: 'Whispering City', type: 'STORY', color: 'bg-blue-100', saves: 250, comments: 25, size: 'text', author: 'mock_upl...', desc: 'In a city where buildings whispered secrets, the young historian searched for the truth...' },
    { id: 'l', title: 'Minimal Vector', type: 'ART', color: 'bg-cyan-400', saves: 140, comments: 12, size: 'medium', featured: 'Geometric Shapes' },
    { id: 'm', title: 'Purple Dream', type: 'PHOTO', color: 'bg-purple-500', saves: 270, comments: 31, size: 'medium' },
    { id: 'n', title: 'Field Photo', type: 'PHOTO', color: 'bg-yellow-600', saves: 55, comments: 7, size: 'small', featured: 'Golden Field' }
  ];

  // Shuffle helper
  const shuffleArray = (arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Queue for random items without immediate repeats
  const itemQueueRef = useRef(shuffleArray(baseGalleryItems));

  const getNextBatch = (count) => {
    const batch = [];
    while (batch.length < count) {
      if (itemQueueRef.current.length === 0) {
        itemQueueRef.current = shuffleArray(baseGalleryItems);
      }
      batch.push(itemQueueRef.current.pop());
    }
    return batch;
  };

  // Random photo URL
  const getRandomPhoto = (id) => `https://picsum.photos/400/300?random=${id}`;

  // Load initial items
  useEffect(() => {
    const initial = getNextBatch(10).map((item, index) => ({
      ...item,
      id: `${item.id}-1-${index}`,
      saves: item.saves + 10,
      ...(item.type === 'PHOTO' && { imgUrl: getRandomPhoto(`${item.id}-1-${index}`) }),
    }));
    setDisplayedItems(initial);
  }, []);

  // Load more items
  const loadMore = () => {
    if (loading || page >= 10) return;
    setLoading(true);
    setTimeout(() => {
      const newItems = getNextBatch(10).map((item, index) => ({
        ...item,
        id: `${item.id}-${page + 1}-${index}`,
        saves: item.saves + (page + 1) * 10,
        ...(item.type === 'PHOTO' && { imgUrl: getRandomPhoto(`${item.id}-${page + 1}-${index}`) }),
      }));
      setDisplayedItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
      setLoading(false);
    }, 800);
  };

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [loading, page]);

  const getGridClass = (size) => {
    switch(size) {
      case 'tall': return 'sm:row-span-2';
      case 'medium': return 'sm:row-span-1';
      case 'text': return 'sm:col-span-1';
      default: return 'sm:row-span-1';
    }
  };

  // Filtered items
  const filteredItems = displayedItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex">
      <LeftBar onLogout={onLogout} />

      <main className="flex-1 p-4 sm:p-6 bg-gray-50 min-h-screen">
        <ExploreTopBar onSearch={setSearchQuery} />

        <div className="max-w-6xl mx-auto">
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No results found for "{searchQuery}"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[250px] lg:auto-rows-[220px]">
              {filteredItems.map((item) => {
                const isSaved = savedItems?.[item.id];
                return (
                  <div
                    key={item.id}
                    className={`${item.color} rounded-xl p-4 sm:p-6 relative overflow-hidden group 
                      cursor-pointer hover:scale-[1.02] transition-transform duration-300 
                      ${getGridClass(item.size)}`}
                    style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave?.(item.id); }}
                      className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition z-20"
                      aria-label={isSaved ? "Unsave item" : "Save item"}
                    >
                      <Bookmark
                        size={16}
                        className={`${isSaved ? 'fill-white' : ''} text-white`}
                      />
                    </button>

                    <div className="h-full flex flex-col justify-between">
                      {item.type === 'PHOTO' ? (
                        <img
                          src={item.imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : item.size === 'text' ? (
                        <div className="flex flex-col justify-center h-full">
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{item.type}</span>
                          <h3 className="text-xl font-bold text-gray-800 mb-2 leading-snug">{item.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.desc}</p>
                          <p className="text-xs text-gray-500 mt-2 truncate">~ by {item.author}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-between h-full text-white">
                          {item.featured && (
                            <div className="text-xs font-medium bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full self-start">
                              {item.featured}
                            </div>
                          )}
                          <h3 className="text-2xl font-extrabold drop-shadow-md leading-tight">{item.title}</h3>
                        </div>
                      )}

                      <div className={`flex items-center gap-4 text-xs mt-3 ${item.size === 'text' ? 'text-gray-500' : 'text-white/90'}`}>
                        <span className="flex items-center gap-1">
                          <Bookmark size={14} />
                          {item.saves}
                        </span>
                        <span className="flex items-center gap-1">
                          💬 {item.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div ref={observerTarget} className="flex justify-center py-10">
            {loading ? (
              <div className="flex items-center gap-3 text-lg text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Fetching more amazing content...</span>
              </div>
            ) : page >= 10 ? (
              <p className="text-gray-500 text-sm">You've reached the end of the demo feed.</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
