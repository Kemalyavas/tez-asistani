'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "Automatically fixing the formatting rules I struggled with the most in my thesis is amazing. It solves in minutes what used to take me nights.",
    name: "Adam Y.",
    color: "bg-blue-600"
  },
  {
    id: 2,
    text: "The citation formatting part is truly a lifesaver. When I tried to do it manually I kept making mistakes—now it gets everything right.",
    name: "Zoe K.",
    color: "bg-purple-600"
  },
  {
    id: 3,
    text: "My advisor kept asking for format fixes. Since I started using the app I haven't had a single formatting issue.",
    name: "Michael A.",
    color: "bg-green-600"
  },
  {
    id: 4,
    text: "Figure and table layout used to be so hard. Now everything automatically matches the required standards.",
    name: "Fiona S.",
    color: "bg-red-600"
  },
  {
    id: 5,
    text: "I tried other tools but none were this fast and easy. My thesis process really sped up.",
    name: "Alex R.",
    color: "bg-indigo-600"
  },
  {
    id: 6,
    text: "Formatting the summary and abstract sections was so complex. Now it all becomes clean with one click.",
    name: "Ella T.",
    color: "bg-pink-600"
  },
  {
    id: 7,
    text: "Definitely worth the price. I never thought writing a thesis could feel this easy. I recommend it to everyone.",
    name: "Ethan D.",
    color: "bg-yellow-600"
  }
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex + 1 >= testimonials.length ? 0 : prevIndex + 1
    );
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isTransitioning) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // 4 saniyede bir otomatik geçiş

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying, isTransitioning]);

  const totalSlides = testimonials.length;

  return (
    <div className="relative max-w-6xl mx-auto px-4">
      {/* Main Carousel */}
      <div 
        className="overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Desktop View - 3 cards */}
        <div className="hidden md:block">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${(currentIndex * 100) / 3}%)` }}
          >
            {/* Genişletilmiş testimonial dizisi - smooth döngü için */}
            {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
              <div 
                key={`testimonial-${testimonial.id}-${index}`}
                className="w-1/3 flex-shrink-0 px-3"
              >
                <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl h-full">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 min-h-[100px] leading-relaxed text-sm">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center mt-auto">
                    <div className={`w-10 h-10 ${testimonial.color} rounded-full mr-3 flex items-center justify-center shadow-md`}>
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{testimonial.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View - 1 card */}
        <div className="md:hidden">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={`mobile-testimonial-${testimonial.id}-${index}`}
                className="w-full flex-shrink-0 px-2"
              >
                <div className="bg-white rounded-xl shadow-lg p-6 mx-2">
                  <div className="flex mb-4 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed text-center">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center justify-center">
                    <div className={`w-12 h-12 ${testimonial.color} rounded-full mr-3 flex items-center justify-center shadow-md`}>
                      <span className="text-white font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Hidden on mobile */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
  className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed z-10 group"
  aria-label="Previous testimonials"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
  className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed z-10 group"
  aria-label="Next testimonials"
      >
        <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>

      {/* Mobile Navigation Buttons */}
      <div className="md:hidden flex justify-between items-center mt-4 px-4">
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <span className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {totalSlides}
        </span>
        
        <button
          onClick={nextSlide}
          disabled={isTransitioning}
          className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 hover:scale-125 disabled:cursor-not-allowed ${
              currentIndex === index 
                ? 'bg-blue-600 scale-125 shadow-md' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
