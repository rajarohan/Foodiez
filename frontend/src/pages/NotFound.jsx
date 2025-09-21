import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found-page min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center text-center">
          <div className="col-md-6">
            <div className="mb-4">
              <h1 className="display-1 fw-bold text-primary">404</h1>
              <h2 className="h3 fw-bold text-dark mb-3">Page Not Found</h2>
              <p className="text-muted mb-4">
                Oops! The page you're looking for doesn't exist. 
                It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>
            
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <Link to="/" className="btn btn-primary btn-lg">
                <Home size={18} className="me-2" />
                Go to Homepage
              </Link>
              
              <button 
                onClick={() => window.history.back()} 
                className="btn btn-outline-primary btn-lg"
              >
                <ArrowLeft size={18} className="me-2" />
                Go Back
              </button>
            </div>

            <div className="mt-4">
              <p className="text-muted">
                Or try searching for what you need:
              </p>
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search restaurants or dishes..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(e.target.value.trim())}`;
                    }
                  }}
                />
                <button className="btn btn-primary" type="button">
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;