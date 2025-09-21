import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light pt-5">
      <div className="container">
        <div className="row">
          {/* Brand and Description */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="d-flex align-items-center mb-3">
              <UtensilsCrossed size={32} className="me-2 text-primary" />
              <h4 className="mb-0 fw-bold">Foodiez</h4>
            </div>
            <p className="text-light-emphasis">
              Your favorite food delivery app. Order from the best restaurants 
              in your area and get fresh, delicious meals delivered right to your door.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light-emphasis hover-primary">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-light-emphasis hover-primary">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-light-emphasis hover-primary">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-light-emphasis hover-primary">
                <Github size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h5 className="fw-bold mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-light-emphasis text-decoration-none hover-primary">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/restaurants" className="text-light-emphasis text-decoration-none hover-primary">
                  Restaurants
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-light-emphasis text-decoration-none hover-primary">
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-light-emphasis text-decoration-none hover-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h5 className="fw-bold mb-3">Support</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/help" className="text-light-emphasis text-decoration-none hover-primary">
                  Help Center
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/privacy" className="text-light-emphasis text-decoration-none hover-primary">
                  Privacy Policy
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/terms" className="text-light-emphasis text-decoration-none hover-primary">
                  Terms of Service
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="text-light-emphasis text-decoration-none hover-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="col-lg-4 col-md-6 mb-4">
            <h5 className="fw-bold mb-3">Contact Us</h5>
            <div className="d-flex align-items-center mb-2">
              <MapPin size={18} className="me-2 text-primary" />
              <span className="text-light-emphasis">
                123 Food Street, Delivery City, DC 12345
              </span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <Phone size={18} className="me-2 text-primary" />
              <span className="text-light-emphasis">
                +1 (555) 123-FOOD
              </span>
            </div>
            <div className="d-flex align-items-center mb-3">
              <Mail size={18} className="me-2 text-primary" />
              <span className="text-light-emphasis">
                support@foodiez.com
              </span>
            </div>
            
            {/* Newsletter Subscription */}
            <div className="mt-3">
              <h6 className="fw-bold mb-2">Subscribe to our newsletter</h6>
              <div className="input-group">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Enter your email"
                  aria-label="Email for newsletter"
                />
                <button className="btn btn-primary" type="button">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary" />

        {/* Bottom Footer */}
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0 text-light-emphasis">
              &copy; {currentYear} Foodiez. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0 text-light-emphasis">
              Made with ❤️ for food lovers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;