import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  TruckIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      name: 'Quick Search',
      description: 'Find restaurants and dishes easily with our powerful search.',
      icon: MagnifyingGlassIcon,
    },
    {
      name: 'Fast Delivery',
      description: 'Get your favorite food delivered hot and fresh in 30 minutes.',
      icon: TruckIcon,
    },
    {
      name: '24/7 Service',
      description: 'Order anytime, anywhere. We\'re here around the clock.',
      icon: ClockIcon,
    },
    {
      name: 'Top Rated',
      description: 'Choose from thousands of highly rated restaurants.',
      icon: StarIcon,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-responsive section-spacing">
          <div className="text-center">
            <h1 className="text-responsive-lg font-bold text-white mb-4 sm:mb-6">
              Hungry? We've got you covered!
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-primary-100 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Order from your favorite restaurants and get fresh, hot food delivered to your doorstep in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                to="/restaurants"
                className="w-full sm:w-auto btn-secondary text-lg px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Browse Restaurants
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary-700 text-lg px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="section-spacing bg-white">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-responsive-md font-bold text-gray-900 mb-4">
              Why Choose Foodiez?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-16 max-w-2xl mx-auto">
              We make food ordering simple, fast, and delicious.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="text-center card-hover p-6">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 section-spacing">
        <div className="container-responsive">
          <div className="text-center">
            <h2 className="text-responsive-md font-bold text-gray-900 mb-4">
              Ready to order?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Foodiez for their meals.
            </p>
            <Link
              to="/restaurants"
              className="inline-block btn-primary text-lg px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Ordering Now
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 py-12 sm:py-16">
        <div className="container-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-primary-200 text-sm sm:text-base">Partner Restaurants</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">50k+</div>
              <div className="text-primary-200 text-sm sm:text-base">Happy Customers</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">100k+</div>
              <div className="text-primary-200 text-sm sm:text-base">Orders Delivered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;