'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "Tez yazımında en çok zorlandığım format kurallarını otomatik düzeltmesi müthiş. Gecelerce uğraştığım şeyleri dakikalar içinde hallediyor.",
    name: "Ahmet Y.",
    color: "bg-blue-600"
  },
  {
    id: 2,
    text: "Kaynak gösterimi kısmı gerçekten hayat kurtarıcı. Manuel olarak yapmaya çalıştığımda sürekli hata yapıyordum, şimdi hepsini doğru yapıyor.",
    name: "Zeynep K.",
    color: "bg-purple-600"
  },
  {
    id: 3,
    text: "Danışmanım sürekli format düzeltmeleri istiyordu. Bu uygulamayı kullanmaya başladığımdan beri hiç format sorunu yaşamadım.",
    name: "Mehmet A.",
    color: "bg-green-600"
  },
  {
    id: 4,
    text: "Özellikle figür ve tablo düzenlemesi çok zor geliyordu. Şimdi her şey otomatik olarak YÖK standartlarına uygun hale geliyor.",
    name: "Fatma S.",
    color: "bg-red-600"
  },
  {
    id: 5,
    text: "Başka programları denemiştim ama bu kadar kolay ve hızlı çalışanını görmedim. Tez sürecim çok hızlandı.",
    name: "Ali R.",
    color: "bg-indigo-600"
  },
  {
    id: 6,
    text: "Özet ve abstract kısımlarının formatlanması çok karmaşıktı. Artık tek tıkla her şey düzgün hale geliyor.",
    name: "Elif T.",
    color: "bg-pink-600"
  },
  {
    id: 7,
    text: "Para vermeye değdi gerçekten. Tez yazmak bu kadar kolay olabileceğini düşünmemiştim. Herkese tavsiye ediyorum.",
    name: "Emre D.",
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
        aria-label="Önceki yorumlar"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed z-10 group"
        aria-label="Sonraki yorumlar"
      >
        <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
      </button>

      {/* Mobile Navigation Buttons */}
      <div className="md:hidden flex justify-between items-center mt-4 px-4">
        <button
          onClick={prevSlide}
          disabled={isTransitioning}
          className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Önceki yorum"
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
          aria-label="Sonraki yorum"
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
            aria-label={`${index + 1}. slide'a git`}
          />
        ))}
      </div>
    </div>
  );
}
