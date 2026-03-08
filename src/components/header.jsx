import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/Images/PLogo.png';
import { Menu, X } from 'lucide-react'; 

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out">
      <div className={`container mx-auto px-4 sm:px-6 py-3 flex items-center transition-all duration-300 ${
        isScrolled ? 'justify-center' : 'justify-between'
      }`}>
        
        {/* Logo */}
        {!isScrolled && (
          <div className="flex items-center">
            <Link to="/" className="text-3xl font-bold text-black">
              <img
                className="w-28 sm:w-32 md:w-36 h-auto" 
                src={Logo}
                alt="Rest & Relax logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </Link>
          </div>
        )}

        {/* Mobile Menu Button (Hamburger) */}
        <button 
          className="md:hidden p-2 text-black z-50 ml-auto"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Navigation Links - Desktop */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          className={`hidden md:block transition-all duration-300 ease-in-out ${
            isScrolled
              ? 'bg-white/30 backdrop-blur-md rounded-full shadow-md px-6 lg:px-8 py-2 md:py-3' 
              : 'bg-transparent'
          }`}
        >
          <ul className="flex space-x-4 lg:space-x-8 text-base lg:text-lg text-black">
            <li><Link to="/" className="hover:text-[#008DDA] transition-colors whitespace-nowrap">Home</Link></li>
            <li><Link to="/locations" className="hover:text-[#008DDA] transition-colors whitespace-nowrap">Locations</Link></li>
            <li><Link to="/reviews" className="hover:text-[#008DDA] transition-colors whitespace-nowrap">Reviews</Link></li>
            <li><Link to="/memories" className="hover:text-[#008DDA] transition-colors whitespace-nowrap">Memories</Link></li>
            {/* <li><Link to="/contact-us" className="hover:text-[#008DDA] transition-colors whitespace-nowrap">Contact Us</Link></li> */}
          </ul>
        </nav>

        {/* CTA Button - Desktop */}
        {!isScrolled && (
          <button className="hidden md:block bg-[#008DDA] text-white px-4 py-1.5 lg:px-6 lg:py-2 rounded-full font-medium hover:bg-[#0480c3] transition-colors shadow-md whitespace-nowrap text-sm lg:text-base">
            Book Now →
          </button>
        )}

        {/* Mobile Menu Compact Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-64 xs:w-72 bg-white/95 backdrop-blur-sm shadow-xl z-40 transition-transform duration-300 ease-in-out md:hidden ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="flex justify-end p-4">
             {/* Close button inside the drawer, but the hamburger icon is outside in the header */}
          </div>
          <nav className="p-6">
            <ul className="flex flex-col space-y-6 text-l text-black">
              <li><Link to="/" onClick={toggleMenu} className="hover:text-[#008DDA] transition-colors">Home</Link></li>
              <li><Link to="/locations" onClick={toggleMenu} className="hover:text-[#008DDA] transition-colors">Locations</Link></li>
              <li><Link to="/rates" onClick={toggleMenu} className="hover:text-[#008DDA] transition-colors">Rates</Link></li>
              <li><Link to="/memories" onClick={toggleMenu} className="hover:text-[#008DDA] transition-colors">Memories</Link></li>
              <li><Link to="/contact-us" onClick={toggleMenu} className="hover:text-[#008DDA] transition-colors">Contact Us</Link></li>
            </ul>
            <button onClick={toggleMenu} className="bg-[#008DDA] text-white w-full px-4 py-2 mt-10 rounded-full font-sm hover:bg-[#0480c3] transition-colors shadow-lg">
                Book Now →
            </button>
          </nav>
        </div>
        
        {/* Overlay to close when clicking outside of the drawer */}
        {isMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/20 z-30 md:hidden" 
                onClick={toggleMenu}
                aria-hidden="true"
            />
        )}
      </div>
    </header>
  );
}

export default Header;