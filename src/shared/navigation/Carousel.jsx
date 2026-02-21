import { useState, useEffect } from 'react';

export default function Carousel({ slides = [], interval = 3000 }) {
  if (slides.length === 0) {
    return (
      <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
        <span>No slides</span>
      </div>
    );
  }

  // clone last + first slide
  const extendedSlides = [
    slides[slides.length - 1],
    ...slides,
    slides[0],
  ];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // autoplay
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [slides.length, interval]);

  // handle seamless loop reset
  const handleTransitionEnd = () => {
    if (currentIndex === extendedSlides.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }

    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(extendedSlides.length - 2);
    }
  };

  // re-enable animation after snap
  useEffect(() => {
    if (!isTransitioning) {
      requestAnimationFrame(() => setIsTransitioning(true));
    }
  }, [isTransitioning]);

  // real index for dots + overlay
  const realIndex =
    currentIndex === 0
      ? slides.length - 1
      : currentIndex === extendedSlides.length - 1
      ? 0
      : currentIndex - 1;

  const currentSlide = slides[realIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-xl h-36 sm:h-40 md:h-52">
      {/* Images */}
      <div
        className={`flex h-full ${
          isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''
        }`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.image}
            alt={slide.title}
            className="min-w-full h-full object-cover"
          />
        ))}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 transition-colors duration-500"
        style={{
          backgroundColor: `${currentSlide.overlay}B3`,
        }}
      >
        <h3 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          {currentSlide.title}
        </h3>
        <p className="text-white text-sm sm:text-base md:text-xl italic">
          {currentSlide.description}
        </p>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx + 1)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === realIndex
                ? 'bg-[#3878c2]'
                : 'bg-transparent border border-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
