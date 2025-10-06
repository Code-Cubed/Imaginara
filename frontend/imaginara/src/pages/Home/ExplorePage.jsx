import React, { useState, useEffect, useRef } from 'react';
import { Bookmark } from 'lucide-react';

const ExplorePage = () => {
  const [savedItems, setSavedItems] = useState({});
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  const baseGalleryItems = [
    { id: 1, title: 'Crimson Sunset...', type: 'PHOTO', color: 'bg-red-500', saves: 0, comments: 15, size: 'small' },
    { id: 2, title: 'Ode to Lost Time', type: 'POEM', color: 'bg-blue-100', saves: 0, comments: 5, size: 'text', author: 'mock_upl...', desc: 'The clock ticks backward, a phantom sound, Where all m...' },
    { id: 3, title: 'Recipe: Galactic Stew', type: 'STORY', color: 'bg-blue-100', saves: 0, comments: 40, size: 'text', author: 'mock_upl...', desc: 'A story about a chef who travels the stars, collecting ingredien...' },
    { id: 4, title: 'Haiku Series: Ocean', type: 'POEM', color: 'bg-blue-100', saves: 0, comments: 3, size: 'text', author: 'mock_upl...', desc: 'Blue vastness calls deep, Waves crash on the silent sand,...' },
    { id: 5, title: 'The Final Note', type: 'STORY', color: 'bg-blue-100', saves: 0, comments: 14, size: 'text', author: 'mock_upl...', desc: 'She found the sheet music tucked into the attic box. It was a...' },
    { id: 6, title: 'The Abstract...', type: 'ART', color: 'bg-blue-600', saves: 0, comments: 8, size: 'small' },
    { id: 7, title: 'Forest Guardian', type: 'PHOTO', color: 'bg-green-600', saves: 0, comments: 22, size: 'tall', featured: 'Deep Forest Shot' },
    { id: 8, title: 'Monochrome...', type: 'PHOTO', color: 'bg-slate-800', saves: 0, comments: 18, size: 'medium', featured: 'B&W Street' },
    { id: 9, title: 'Rusty Robot...', type: 'ART', color: 'bg-orange-500', saves: 0, comments: 10, size: 'small', featured: 'Robot Toy' },
    { id: 10, title: 'Abstract...', type: 'ART', color: 'bg-yellow-500', saves: 0, comments: 9, size: 'medium', featured: 'Expressive Oil' },
    { id: 11, title: 'Chapter 1: The Whispering City', type: 'STORY', color: 'bg-blue-100', saves: 0, comments: 25, size: 'text', author: 'mock_upl...', desc: 'In a city where buildings whispered secrets...' },
    { id: 12, title: 'Minimal Vector', type: 'ART', color: 'bg-cyan-400', saves: 0, comments: 12, size: 'medium', featured: 'Minimal Vector' },
    { id: 13, title: 'Purple Dream', type: 'PHOTO', color: 'bg-purple-500', saves: 0, comments: 31, size: 'medium' },
    { id: 14, title: 'Field Photo', type: 'PHOTO', color: 'bg-yellow-600', saves: 0, comments: 7, size: 'small', featured: 'Field Photo' }
  ];

  
  const generateMoreItems = (pageNum) => {
    return baseGalleryItems.map((item, index) => ({
      ...item,
      id: `${pageNum}-${index}`,
      title: `${item.title} (${pageNum})`,
    }));
  };

  
  useEffect(() => {
    setDisplayedItems(generateMoreItems(1));
  }, []);

  
  const loadMore = () => {
    if (loading) return;
    
    setLoading(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const newItems = generateMoreItems(nextPage);
      setDisplayedItems(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setLoading(false);
    }, 500);
  };

  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loading, page]);

  const toggleSave = (id) => {
    setSavedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGridClass = (size) => {
    switch(size) {
      case 'tall': return 'row-span-2';
      case 'medium': return 'row-span-1';
      case 'text': return 'col-span-1';
      default: return 'row-span-1';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className={`${item.color} rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform ${getGridClass(item.size)}`}
            >
              
              <button
                onClick={() => toggleSave(item.id)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/30 transition z-10"
              >
                <Bookmark
                  size={18}
                  className={`${savedItems[item.id] ? 'fill-white' : ''} text-white`}
                />
              </button>

              
              <div className="h-full flex flex-col justify-between">
                {item.size === 'text' ? (
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{item.type}</span>
                    <h3 className="text-lg font-bold text-gray-800 mt-2 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.desc}</p>
                    <p className="text-xs text-gray-500 mt-2">~ by {item.author}</p>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full">
                    {item.featured && (
                      <div className="text-sm font-medium text-white/90">{item.featured}</div>
                    )}
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{item.title}</h3>
                  </div>
                )}
                
                
                <div className="flex items-center gap-4 text-xs mt-3">
                  <span className={`flex items-center gap-1 ${item.size === 'text' ? 'text-gray-600' : 'text-white/90'}`}>
                    <Bookmark size={14} />
                    {item.saves} Saves
                  </span>
                  <span className={`flex items-center gap-1 ${item.size === 'text' ? 'text-gray-600' : 'text-white/90'}`}>
                    💬 {item.comments} Comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div ref={observerTarget} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;