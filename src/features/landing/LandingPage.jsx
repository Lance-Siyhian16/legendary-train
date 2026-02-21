import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from '../../shared/navigation/Carousel';
import { useLayout } from '../../app/LayoutContext';
import { defaultFaqs } from '../../shared/constants/faqs';

const landingImage =
  'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=1600&h=800&fit=crop';

const carouselSlides = [
  {
    title: 'WASH',
    description: 'Fresh, clean, handled with care.',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=400&fit=crop',
    overlay: '#63bce6',
  },
  {
    title: 'DRY',
    description: 'Quick and gentle drying.',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=400&fit=crop',
    overlay: '#ffb850',
  },
  {
    title: 'FOLD',
    description: 'Neat, organized, ready to wear.',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&h=400&fit=crop',
    overlay: '#ffde59',
  },
];

/* ===== SERVICE RATES DATA ===== */
const serviceRates = [
  {
    name: 'WASH',
    price: 60,
    items: [
      {
        title: 'Regular Light Mix (up to 7.5kg)',
        description: 'Shirts, Blouses/Polo, Pants, Socks, Underwear',
      },
      {
        title: 'Heavy Load (up to 5kg)',
        description: 'Beddings, Towels, Jeans, Fleece, Regular Jackets',
      },
      {
        title: 'Per Piece',
        description: 'Comforter, Duvet, Pillow',
      },
    ],
  },
  {
    name: 'DRY',
    price: 65,
    items: [
      {
        title: 'Regular Light Mix (up to 7.5kg)',
        description: 'Shirts, Blouses/Polo, Pants, Socks, Underwear',
      },
      {
        title: 'Heavy Load (up to 5kg)',
        description: 'Beddings, Towels, Jeans, Fleece, Regular Jackets',
      },
      {
        title: 'Per Piece',
        description: 'Comforter, Duvet, Pillow',
      },
    ],
  },
  {
    name: 'FOLD',
    price: 30,
    items: [
      {
        title: 'Regular Light Mix (up to 7.5kg)',
        description: 'Shirts, Blouses/Polo, Pants, Socks, Underwear',
      },
      {
        title: 'Heavy Load (up to 5kg)',
        description: 'Beddings, Towels, Jeans, Fleece, Regular Jackets',
      },
      {
        title: 'Per Piece',
        description: 'Comforter, Duvet, Pillow',
      },
    ],
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [openRate, setOpenRate] = useState(null);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const navigate = useNavigate();
  const { setHideBottomNav } = useLayout();

  useEffect(() => {
    setHideBottomNav(true);
    return () => setHideBottomNav(false);
  }, [setHideBottomNav]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1500px)');

    const updateWideDesktop = (event) => setIsWideDesktop(event.matches);
    setIsWideDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateWideDesktop);
      return () => mediaQuery.removeEventListener('change', updateWideDesktop);
    }

    mediaQuery.addListener(updateWideDesktop);
    return () => mediaQuery.removeListener(updateWideDesktop);
  }, []);

  return (
    <section>
      {/* Hero Section */}
      <div className="relative h-[460px] sm:h-[560px] md:h-[700px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${landingImage})` }}
        />
        <div className="absolute inset-0 bg-[#3878c2]/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 pt-6 sm:pt-8 max-w-3xl">
            <h1 className="text-white text-2xl sm:text-3xl md:text-5xl font-semibold mb-4">
              Fast. Fresh. Hassle-free laundry services.
            </h1>
            <p className="text-white/90 text-sm sm:text-base md:text-lg mb-10 leading-relaxed text-center sm:text-justify">
              Welcome to Herland Laundry, your all-in-one online laundry solution.
              We make it easier than ever to keep your clothes clean and ready—
              no queues, no stress, just dependable service at your fingertips.
            </p>
            <button
              className="w-full sm:w-auto bg-[#4bad40] text-white px-10 py-3.5 rounded-full font-semibold"
              onClick={() => navigate('/login')}
            >
              Book Now
            </button>
            <div className="h-6 sm:h-8" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Our Services */}
      <div id="services" className="mt-12 px-5 sm:px-6 md:px-8 xl:px-12 max-w-6xl mx-auto">
        <h2 className="text-[#3878c2] text-3xl font-bold mb-6">
          Our Services
        </h2>
        <Carousel slides={carouselSlides} />
      </div>

      {/* Service Rates */}
      <div id="rates" className="mt-12 px-5 sm:px-6 md:px-8 xl:px-12 max-w-6xl mx-auto">
        <h2 className="text-[#3878c2] text-3xl font-bold mb-6">
          Service Rates
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceRates.map((service, index) => (
            <div
              key={service.name}
              className={`rounded-xl border border-[#3878c2] p-5 transition-all ${
                isWideDesktop || openRate === index ? 'bg-[#63bce6]/10' : ''
              }`}
            >
              {isWideDesktop ? (
                <div className="text-[#3878c2] font-semibold text-lg">
                  {service.name}
                </div>
              ) : (
                <button
                  onClick={() =>
                    setOpenRate(openRate === index ? null : index)
                  }
                  className="w-full flex justify-between items-center text-[#3878c2] font-semibold text-lg"
                >
                  {service.name}
                  <span
                    className={`text-[#4bad40] transform transition-transform ${
                      openRate === index ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
              )}

              {(isWideDesktop || openRate === index) && (
                <>
                  <hr className="my-4 border-[#3878c2]" />

                  <div className="space-y-4">
                    {service.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-start gap-4"
                      >
                        <div>
                          <p className="text-[#3878c2] font-medium">
                            {item.title}
                          </p>
                          <p className="text-sm text-[#3878c2]/80">
                            {item.description}
                          </p>
                        </div>
                        <div className="font-semibold text-[#3878c2] whitespace-nowrap">
                          ₱{service.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="mt-12 px-5 sm:px-6 md:px-8 xl:px-12 max-w-6xl mx-auto">
        <h2 className="text-[#3878c2] text-2xl font-bold mb-6">
          Frequently Asked Questions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {defaultFaqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`rounded-xl border border-[#3878c2] p-4 transition-all ${
                isWideDesktop || openFaq === index ? 'bg-[#63bce6]/10' : ''
              }`}
            >
              {isWideDesktop ? (
                <div className="w-full text-left text-[#3878c2] font-semibold text-sm sm:text-base md:text-lg">
                  {faq.question}
                </div>
              ) : (
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="w-full text-left text-[#3878c2] font-semibold text-sm sm:text-base md:text-lg flex justify-between items-center gap-3"
                >
                  {faq.question}
                  <span
                    className={`transform transition-transform text-[#4bad40] ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
              )}

              {(isWideDesktop || openFaq === index) && (
                <>
                  <hr className="my-4 border-[#3878c2]" />
                  <p className="text-[#3878c2] text-justify">
                    {faq.answer}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Us */}
      <div id="services" className="mt-12 px-5 sm:px-6 md:px-8 xl:px-12 max-w-6xl mx-auto space-y-1">
        <h2 className="text-[#3878c2] text-3xl font-bold mb-6">
          Contact Us
        </h2>
        <p className="text-[#3878c2] text-sm sm:text-base">📍 123 Laundry Street, Pasay City</p>
        <p className="text-[#3878c2] text-sm sm:text-base">📞 +63 912 345 6789</p>
        <p className="text-[#3878c2] text-sm sm:text-base">✉️ hello@herlandlaundry.com</p>
      </div>

      {/* Footer */}
      <footer className="mt-12 px-5 sm:px-6 md:px-8 xl:px-12 pb-6 text-center text-xs sm:text-sm text-[#b4b4b4]">
          © 2026 Herland Laundry. All rights reserved.
      </footer>
    </section>
  );
}
